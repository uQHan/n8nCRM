package com.uqhan.n8ncrmbackend.web.dto;

import java.util.List;

public record ApiEmailPlaceholdersResponse(
		List<ApiEmailPlaceholder> placeholders
) {
}
