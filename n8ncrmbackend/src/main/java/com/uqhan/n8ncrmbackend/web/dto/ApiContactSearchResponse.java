package com.uqhan.n8ncrmbackend.web.dto;

import java.util.List;

public record ApiContactSearchResponse(
		List<ApiContactSummary> items,
		long total,
		int page,
		int size
) {
}
