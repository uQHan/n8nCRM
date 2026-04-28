package com.uqhan.n8ncrmbackend.web;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.uqhan.n8ncrmbackend.entity.ProcessingJob;
import com.uqhan.n8ncrmbackend.repo.ProcessedContactRepository;
import com.uqhan.n8ncrmbackend.repo.ProcessingJobRepository;
import com.uqhan.n8ncrmbackend.service.CrmJobService;
import com.uqhan.n8ncrmbackend.web.dto.ApiProcessedContact;
import com.uqhan.n8ncrmbackend.web.dto.ApiProcessingJob;
import com.uqhan.n8ncrmbackend.web.dto.CrmStartJobRequest;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/crm")
public class CrmController {
	private final CrmJobService jobService;
	private final ProcessingJobRepository jobRepository;
	private final ProcessedContactRepository contactRepository;

	public CrmController(
			CrmJobService jobService,
			ProcessingJobRepository jobRepository,
			ProcessedContactRepository contactRepository
	) {
		this.jobService = jobService;
		this.jobRepository = jobRepository;
		this.contactRepository = contactRepository;
	}

	@PostMapping("/jobs")
	public ApiProcessingJob startJob(@Valid @RequestBody CrmStartJobRequest req) {
		ProcessingJob job = jobService.createJobAndStart(
				req.data(),
				req.columnMappings(),
				req.enrichmentOptions(),
				req.totalRows()
		);
		return ApiProcessingJob.from(job);
	}

	@GetMapping("/jobs/{jobId}")
	public ApiProcessingJob getJob(@PathVariable UUID jobId) {
		ProcessingJob job = jobRepository.findById(jobId)
				.orElseThrow(() -> new IllegalArgumentException("Job not found"));
		return ApiProcessingJob.from(job);
	}

	// Issue #7: Return DTOs instead of raw JPA entities
	@GetMapping("/jobs/{jobId}/processed-contacts")
	public List<ApiProcessedContact> getProcessedContacts(@PathVariable UUID jobId) {
		return contactRepository.findByJob_IdOrderByCreatedAtAsc(jobId).stream()
				.map(ApiProcessedContact::from)
				.toList();
	}
}
