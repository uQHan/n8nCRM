package com.uqhan.n8ncrmbackend.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.uqhan.n8ncrmbackend.entity.ProcessedContact;
import com.uqhan.n8ncrmbackend.entity.ProcessingJob;
import com.uqhan.n8ncrmbackend.repo.ProcessedContactRepository;
import com.uqhan.n8ncrmbackend.repo.ProcessingJobRepository;

@Service
public class CrmJobService {
	private final ProcessingJobRepository jobRepository;
	private final ProcessedContactRepository contactRepository;
	private final N8nClient n8nClient;
	private final ObjectMapper objectMapper;

	public CrmJobService(
			ProcessingJobRepository jobRepository,
			ProcessedContactRepository contactRepository,
			N8nClient n8nClient,
			ObjectMapper objectMapper
	) {
		this.jobRepository = jobRepository;
		this.contactRepository = contactRepository;
		this.n8nClient = n8nClient;
		this.objectMapper = objectMapper;
	}

	@Transactional
	public ProcessingJob createJobAndStart(
			List<Map<String, Object>> data,
			Map<String, String> columnMappings,
			Map<String, Object> enrichmentOptions,
			int totalRows
	) {
		ProcessingJob job = new ProcessingJob();
		job.setStatus(ProcessingJob.Status.uploading);
		job.setProgress(0);
		job.setCurrentStage("uploaded");
		job.setTotalRows(totalRows);
		job.setProcessedRows(0);
		job.setErrorCount(0);
		job = jobRepository.save(job);

		processAsync(job.getId(), data, columnMappings, enrichmentOptions, totalRows);
		return job;
	}

	@Async
	@Transactional
	public void processAsync(
			UUID jobId,
			List<Map<String, Object>> data,
			Map<String, String> columnMappings,
			Map<String, Object> enrichmentOptions,
			int totalRows
	) {
		ProcessingJob job = jobRepository.findById(jobId)
				.orElseThrow(() -> new IllegalStateException("Job not found: " + jobId));
		try {
			job.setStatus(ProcessingJob.Status.cleaning);
			job.setCurrentStage("validating");
			job.setProgress(10);
			jobRepository.save(job);

			Map<String, Object> payload = new HashMap<>();
			payload.put("jobId", jobId.toString());
			payload.put("data", data);
			payload.put("columnMappings", columnMappings);
			payload.put("enrichmentOptions", enrichmentOptions);
			payload.put("totalRows", totalRows);

			job.setCurrentStage("cleaning");
			job.setProgress(25);
			jobRepository.save(job);

			JsonNode response = n8nClient.callCrmWorkflow(payload);
			List<JsonNode> contactsJson = extractContacts(response);

			job.setStatus(ProcessingJob.Status.enriching);
			job.setCurrentStage("saving");
			job.setProgress(85);
			jobRepository.save(job);

			int processed = 0;
			int errors = 0;
			List<ProcessedContact> toSave = new ArrayList<>();
			for (JsonNode node : contactsJson) {
				String email = textOrNull(node.get("email"));
				if (email == null || email.isBlank()) {
					errors++;
					continue;
				}
				if (contactRepository.existsByEmail(email)) {
					errors++;
					continue;
				}

				ProcessedContact c = new ProcessedContact();
				c.setJob(job);
				c.setEmail(email);
				c.setName(textOrNull(node.get("name")));
				c.setPhone(textOrNull(node.get("phone")));
				c.setCompany(textOrNull(node.get("company")));
				c.setTitle(textOrNull(node.get("title")));
				c.setAddress(textOrNull(node.get("address")));
				c.setCity(textOrNull(node.get("city")));
				c.setState(textOrNull(node.get("state")));
				c.setCountry(textOrNull(node.get("country")));
				c.setZip(textOrNull(node.get("zip")));
				c.setWebsite(textOrNull(node.get("website")));
				c.setEmailVerified(boolOrNull(node.get("email_verified")));
				c.setEmailDeliverable(boolOrNull(node.get("email_deliverable")));
				c.setCompanyDomain(textOrNull(node.get("company_domain")));
				c.setPhoneFormatted(textOrNull(node.get("phone_formatted")));
				c.setPhoneValid(boolOrNull(node.get("phone_valid")));
				c.setEnriched(boolOrNull(node.get("enriched")));
				c.setDuplicate(boolOrNull(node.get("is_duplicate")));
				c.setDuplicateOf(uuidOrNull(node.get("duplicate_of")));
				c.setDataQualityScore(intOrNull(node.get("data_quality_score")));
				c.setOriginalData(node.has("original_data") ? node.get("original_data").toString() : null);
				toSave.add(c);
				processed++;
			}

			contactRepository.saveAll(toSave);

			job.setProcessedRows(processed);
			job.setErrorCount(errors);
			job.setStatus(ProcessingJob.Status.completed);
			job.setCurrentStage("completed");
			job.setProgress(100);
			jobRepository.save(job);
		} catch (Exception e) {
			job.setStatus(ProcessingJob.Status.failed);
			job.setCurrentStage("failed");
			job.setProgress(100);
			jobRepository.save(job);
		}
	}

	private List<JsonNode> extractContacts(JsonNode response) {
		if (response == null || response.isNull()) {
			return List.of();
		}
		JsonNode node;
		if (response.isArray()) {
			node = response;
		} else if (response.has("processedContacts")) {
			node = response.get("processedContacts");
		} else if (response.has("data")) {
			node = response.get("data");
		} else {
			node = objectMapper.createArrayNode();
		}
		if (!node.isArray()) {
			return List.of();
		}
		List<JsonNode> out = new ArrayList<>();
		node.forEach(out::add);
		return out;
	}

	private static String textOrNull(JsonNode node) {
		return (node == null || node.isNull()) ? null : node.asText(null);
	}

	private static Boolean boolOrNull(JsonNode node) {
		return (node == null || node.isNull()) ? null : node.asBoolean();
	}

	private static Integer intOrNull(JsonNode node) {
		return (node == null || node.isNull()) ? null : node.asInt();
	}

	private static UUID uuidOrNull(JsonNode node) {
		if (node == null || node.isNull()) return null;
		try {
			String text = node.asText(null);
			return text == null ? null : UUID.fromString(text);
		} catch (Exception e) {
			return null;
		}
	}
}
