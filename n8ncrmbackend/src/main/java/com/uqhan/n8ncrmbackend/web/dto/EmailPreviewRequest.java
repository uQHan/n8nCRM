package com.uqhan.n8ncrmbackend.web.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record EmailPreviewRequest(
		@NotNull UUID contact_id,
		@NotBlank String subject_template,
		@NotBlank String body_template
) {
}
