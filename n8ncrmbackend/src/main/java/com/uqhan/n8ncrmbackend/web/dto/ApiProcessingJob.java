package com.uqhan.n8ncrmbackend.web.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

import com.uqhan.n8ncrmbackend.entity.ProcessingJob;

public record ApiProcessingJob(
		UUID id,
		String status,
		int progress,
		String current_stage,
		int total_rows,
		int processed_rows,
		int error_count,
		OffsetDateTime created_at,
		OffsetDateTime updated_at
) {
	public static ApiProcessingJob from(ProcessingJob j) {
		return new ApiProcessingJob(
				j.getId(),
				j.getStatus().name(),
				j.getProgress(),
				j.getCurrentStage(),
				j.getTotalRows(),
				j.getProcessedRows(),
				j.getErrorCount(),
				j.getCreatedAt(),
				j.getUpdatedAt()
		);
	}
}
