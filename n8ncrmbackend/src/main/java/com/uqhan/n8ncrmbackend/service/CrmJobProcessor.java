package com.uqhan.n8ncrmbackend.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.JsonNode;
import com.uqhan.n8ncrmbackend.entity.JobProcessedContact;
import com.uqhan.n8ncrmbackend.entity.ProcessedContact;
import com.uqhan.n8ncrmbackend.entity.ProcessingJob;
import com.uqhan.n8ncrmbackend.repo.JobProcessedContactRepository;
import com.uqhan.n8ncrmbackend.repo.ProcessedContactRepository;
import com.uqhan.n8ncrmbackend.repo.ProcessingJobRepository;

/**
 * Handles the asynchronous processing of CRM data.
 * Extracted from CrmJobService so Spring's @Async proxy works correctly
 * (self-invocation on the same class bypasses the proxy).
 */
@Service
public class CrmJobProcessor {
	private static final Logger log = LoggerFactory.getLogger(CrmJobProcessor.class);

	private final ProcessingJobRepository jobRepository;
	private final ProcessedContactRepository contactRepository;
	private final JobProcessedContactRepository jobProcessedContactRepository;
	private final N8nClient n8nClient;

	public CrmJobProcessor(
			ProcessingJobRepository jobRepository,
			ProcessedContactRepository contactRepository,
			JobProcessedContactRepository jobProcessedContactRepository,
			N8nClient n8nClient
	) {
		this.jobRepository = jobRepository;
		this.contactRepository = contactRepository;
		this.jobProcessedContactRepository = jobProcessedContactRepository;
		this.n8nClient = n8nClient;
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

			if (totalRows > 0 && contactsJson.isEmpty()) {
				String responseSnippet;
				try {
					responseSnippet = response == null ? "<null>" : response.toString();
					if (responseSnippet.length() > 800) {
						responseSnippet = responseSnippet.substring(0, 800) + "…";
					}
				} catch (Exception ignored) {
					responseSnippet = "<unavailable>";
				}
				log.warn(
						"CRM job {}: n8n returned 0 contacts for totalRows={} responseType={} responseSnippet={}",
						jobId,
						totalRows,
						response == null ? "null" : response.getNodeType(),
						responseSnippet
				);
				job.setProcessedRows(0);
				job.setErrorCount(totalRows);
				job.setStatus(ProcessingJob.Status.failed);
				job.setCurrentStage("no-contacts-returned");
				job.setProgress(100);
				jobRepository.save(job);
				return;
			}

			job.setStatus(ProcessingJob.Status.enriching);
			job.setCurrentStage("saving");
			job.setProgress(85);
			jobRepository.save(job);

			// Master-list semantics: global unique email; re-uploads update existing contacts.
			// Still keep per-job result reporting via job_processed_contacts.
			int processed = 0;
			int created = 0;
			int updated = 0;
			int errors = 0;
			int skippedBlankEmail = 0;
			int skippedDuplicateInBatch = 0;
			Set<String> seenInBatch = new HashSet<>();
			Map<String, JsonNode> byEmail = new HashMap<>();
			for (JsonNode node : contactsJson) {
				String rawEmail = textOrNull(node.get("email"));
				String email = normalizeEmail(rawEmail);
				if (email == null || email.isBlank()) {
					errors++;
					skippedBlankEmail++;
					continue;
				}
				if (!seenInBatch.add(email)) {
					errors++;
					skippedDuplicateInBatch++;
					continue;
				}
				byEmail.put(email, node);
			}

			Map<String, ProcessedContact> existingByEmail = new HashMap<>();
			if (!byEmail.isEmpty()) {
				for (ProcessedContact c : contactRepository.findByEmailIn(byEmail.keySet())) {
					existingByEmail.put(normalizeEmail(c.getEmail()), c);
				}
			}

			List<ProcessedContact> toSave = new ArrayList<>();
			for (Map.Entry<String, JsonNode> entry : byEmail.entrySet()) {
				String email = entry.getKey();
				JsonNode node = entry.getValue();
				ProcessedContact c = existingByEmail.get(email);
				if (c == null) {
					c = new ProcessedContact();
					c.setJob(job);
					created++;
				} else {
					updated++;
				}
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
				c.setCompanySize(textOrNull(node.get("company_size")));
				c.setCompanyIndustry(textOrNull(node.get("company_industry")));
				c.setCompanyLocation(textOrNull(node.get("company_location")));
				c.setPhoneFormatted(textOrNull(node.get("phone_formatted")));
				c.setPhoneValid(boolOrNull(node.get("phone_valid")));
				c.setEnriched(boolOrNull(node.get("enriched")));
				c.setDuplicate(boolOrNull(node.get("is_duplicate")));
				c.setDuplicateOf(uuidOrNull(node.get("duplicate_of")));
				c.setDataQualityScore(intOrNull(node.get("data_quality_score")));
				c.setOriginalData(node.has("original_data") ? node.get("original_data").toString() : node.toString());
				toSave.add(c);
				processed++;
			}

			List<ProcessedContact> savedContacts = new ArrayList<>();
			contactRepository.saveAll(toSave).forEach(savedContacts::add);

			List<JobProcessedContact> linksToSave = new ArrayList<>();
			for (ProcessedContact c : savedContacts) {
				JobProcessedContact link = new JobProcessedContact();
				link.setJob(job);
				link.setContact(c);
				linksToSave.add(link);
			}
			jobProcessedContactRepository.saveAll(linksToSave);

			log.info(
					"CRM job {}: received={} processed={} created={} updated={} skippedBlankEmail={} skippedDuplicateInBatch={}",
					jobId,
					contactsJson.size(),
					processed,
					created,
					updated,
					skippedBlankEmail,
					skippedDuplicateInBatch
			);

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

		// Contract: n8n responds as a single object containing an array under "processedContacts".
		JsonNode processedContacts = null;
		if (response.isObject()) {
			processedContacts = response.get("processedContacts");
		} else if (response.isArray()
				&& response.size() == 1
				&& response.get(0) != null
				&& response.get(0).isObject()) {
			processedContacts = response.get(0).get("processedContacts");
		}

		if (processedContacts == null || !processedContacts.isArray()) {
			return List.of();
		}

		List<JsonNode> out = new ArrayList<>();
		processedContacts.forEach(out::add);
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

	private static String normalizeEmail(String email) {
		if (email == null) {
			return null;
		}
		String trimmed = email.trim();
		if (trimmed.isBlank()) {
			return null;
		}
		return trimmed.toLowerCase();
	}
}
