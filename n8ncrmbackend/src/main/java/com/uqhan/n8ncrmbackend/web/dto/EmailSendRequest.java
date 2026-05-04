package com.uqhan.n8ncrmbackend.web.dto;

import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

public record EmailSendRequest(
		@NotEmpty List<UUID> contact_ids,
		@NotBlank String subject_template,
		@NotBlank String body_template,
		String delivery_mode,
		boolean is_html,
		boolean dry_run
) {
}
