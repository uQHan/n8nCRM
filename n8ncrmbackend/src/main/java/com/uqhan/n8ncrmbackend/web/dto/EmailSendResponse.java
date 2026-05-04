package com.uqhan.n8ncrmbackend.web.dto;

import java.util.List;

public record EmailSendResponse(
		List<EmailSendItemResult> results,
		long success_count,
		long failure_count
) {
}
