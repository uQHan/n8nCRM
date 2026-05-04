package com.uqhan.n8ncrmbackend.web.dto;

import java.util.UUID;

public record EmailSendItemResult(
		UUID contact_id,
		String to_email,
		boolean success,
		String error
) {
}
