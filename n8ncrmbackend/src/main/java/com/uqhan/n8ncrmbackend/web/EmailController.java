package com.uqhan.n8ncrmbackend.web;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.uqhan.n8ncrmbackend.service.EmailService;
import com.uqhan.n8ncrmbackend.service.EmailTemplateRenderer;
import com.uqhan.n8ncrmbackend.web.dto.ApiEmailPlaceholder;
import com.uqhan.n8ncrmbackend.web.dto.ApiEmailPlaceholdersResponse;
import com.uqhan.n8ncrmbackend.web.dto.EmailPreviewRequest;
import com.uqhan.n8ncrmbackend.web.dto.EmailPreviewResponse;
import com.uqhan.n8ncrmbackend.web.dto.EmailSendItemResult;
import com.uqhan.n8ncrmbackend.web.dto.EmailSendRequest;
import com.uqhan.n8ncrmbackend.web.dto.EmailSendResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/email")
public class EmailController {
	private final EmailService emailService;
	private final EmailTemplateRenderer templateRenderer;

	public EmailController(EmailService emailService, EmailTemplateRenderer templateRenderer) {
		this.emailService = emailService;
		this.templateRenderer = templateRenderer;
	}

	@GetMapping("/placeholders")
	public ApiEmailPlaceholdersResponse placeholders() {
		List<ApiEmailPlaceholder> items = templateRenderer.supportedPlaceholders().entrySet().stream()
				.map(e -> new ApiEmailPlaceholder(e.getKey(), e.getValue()))
				.toList();
		return new ApiEmailPlaceholdersResponse(items);
	}

	@PostMapping("/preview")
	public EmailPreviewResponse preview(@Valid @RequestBody EmailPreviewRequest req) {
		var rendered = emailService.preview(req.contact_id(), req.subject_template(), req.body_template());
		return new EmailPreviewResponse(
				rendered.contact_id(),
				rendered.to_email(),
				rendered.subject(),
				rendered.body()
		);
	}

	@PostMapping("/send")
	public EmailSendResponse send(@Valid @RequestBody EmailSendRequest req) {
		var summary = emailService.sendToContacts(
				req.contact_ids(),
				req.subject_template(),
				req.body_template(),
				req.delivery_mode(),
				req.is_html(),
				req.dry_run()
		);
		return new EmailSendResponse(
				summary.results().stream()
					.map(r -> new EmailSendItemResult(r.contact_id(), r.to_email(), r.success(), r.error()))
					.toList(),
				summary.success_count(),
				summary.failure_count()
		);
	}
}
