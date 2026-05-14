package com.uqhan.n8ncrmbackend.service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

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
		UUID jobId = job.getId();

		// IMPORTANT: only start async processing after the transaction commits.
		// Otherwise the async thread may not see the newly inserted job row yet.
		Runnable startAsync = () -> jobProcessor.processAsync(jobId, data, columnMappings, enrichmentOptions, totalRows);
		if (TransactionSynchronizationManager.isActualTransactionActive()) {
			TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
				@Override
				public void afterCommit() {
					startAsync.run();
				}
			});
		} else {
			startAsync.run();
		}
		return job;
	}
}
