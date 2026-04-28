package com.uqhan.n8ncrmbackend.service;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.uqhan.n8ncrmbackend.entity.ProcessingJob;
import com.uqhan.n8ncrmbackend.repo.ProcessingJobRepository;

@Service
public class CrmJobService {
	private final ProcessingJobRepository jobRepository;
	private final CrmJobProcessor jobProcessor;

	public CrmJobService(
			ProcessingJobRepository jobRepository,
			CrmJobProcessor jobProcessor
	) {
		this.jobRepository = jobRepository;
		this.jobProcessor = jobProcessor;
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

		// Delegate to separate bean so Spring's @Async proxy works correctly
		jobProcessor.processAsync(job.getId(), data, columnMappings, enrichmentOptions, totalRows);
		return job;
	}
}
