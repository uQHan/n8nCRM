package com.uqhan.n8ncrmbackend.web.dto;

import java.util.List;
import java.util.Map;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CrmStartJobRequest(
		@NotNull List<Map<String, Object>> data,
		@NotNull Map<String, String> columnMappings,
		@NotNull Map<String, Object> enrichmentOptions,
		@Min(0) int totalRows
) {
}
