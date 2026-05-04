package com.uqhan.n8ncrmbackend.web.dto;

import java.util.UUID;

public record EmailPreviewResponse(
		UUID contact_id,
		String to_email,
		String subject,
		String body
) {
}
