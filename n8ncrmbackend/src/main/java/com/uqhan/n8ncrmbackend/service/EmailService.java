package com.uqhan.n8ncrmbackend.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.uqhan.n8ncrmbackend.entity.ProcessedContact;
import com.uqhan.n8ncrmbackend.repo.ProcessedContactRepository;

import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {
	private final ProcessedContactRepository contactRepository;
	private final ObjectProvider<JavaMailSender> mailSenderProvider;
	private final EmailTemplateRenderer templateRenderer;
	private final N8nClient n8nClient;

	@Value("${app.mail.from:}")
	private String fromAddress;

	public EmailService(
			ProcessedContactRepository contactRepository,
			ObjectProvider<JavaMailSender> mailSenderProvider,
			EmailTemplateRenderer templateRenderer,
			N8nClient n8nClient
	) {
		this.contactRepository = contactRepository;
		this.mailSenderProvider = mailSenderProvider;
		this.templateRenderer = templateRenderer;
		this.n8nClient = n8nClient;
	}

	@Transactional(readOnly = true)
	public ProcessedContact getContactOrThrow(UUID contactId) {
		return contactRepository.findById(contactId)
				.orElseThrow(() -> new IllegalArgumentException("Contact not found"));
	}

	@Transactional(readOnly = true)
	public RenderedEmail preview(UUID contactId, String subjectTemplate, String bodyTemplate) {
		ProcessedContact c = getContactOrThrow(contactId);
		String subject = templateRenderer.render(subjectTemplate, c);
		String body = templateRenderer.render(bodyTemplate, c);
		return new RenderedEmail(c.getId(), c.getEmail(), subject, body);
	}

	@Transactional
	public SendSummary sendToContacts(
			List<UUID> contactIds,
			String subjectTemplate,
			String bodyTemplate,
			String deliveryMode,
			boolean isHtml,
			boolean dryRun
	) {
		DeliveryMode mode = DeliveryMode.from(deliveryMode);
		JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
		if (mode == DeliveryMode.SMTP && !dryRun && mailSender == null) {
			throw new IllegalStateException("SMTP is not configured (no JavaMailSender bean). Set SMTP_HOST/SMTP_USERNAME/SMTP_PASSWORD.");
		}

		List<ProcessedContact> contacts = contactRepository.findAllById(contactIds);
		Map<UUID, ProcessedContact> byId = new HashMap<>();
		for (ProcessedContact c : contacts) {
			byId.put(c.getId(), c);
		}
		List<SendResult> results = new ArrayList<>();

		for (UUID requestedId : contactIds) {
			ProcessedContact c = byId.get(requestedId);
			if (c == null) {
				results.add(new SendResult(requestedId, null, false, "Contact not found"));
				continue;
			}
			if (c.getEmail() == null || c.getEmail().isBlank()) {
				results.add(new SendResult(c.getId(), null, false, "Missing email"));
				continue;
			}

			if (mode == DeliveryMode.N8N) {
				try {
					if (dryRun) {
						n8nClient.callEmailWorkflow(Map.of(
								"dry_run", true,
								"is_html", isHtml,
								"subject_template", subjectTemplate,
								"body_template", bodyTemplate,
								"contact", toContactPayload(c)
						));
						results.add(new SendResult(c.getId(), c.getEmail(), true, "DRY_RUN_VIA_N8N"));
						continue;
					}

					n8nClient.callEmailWorkflow(Map.of(
							"dry_run", false,
							"is_html", isHtml,
							"subject_template", subjectTemplate,
							"body_template", bodyTemplate,
							"contact", toContactPayload(c)
					));
					results.add(new SendResult(c.getId(), c.getEmail(), true, null));
				} catch (Exception ex) {
					results.add(new SendResult(c.getId(), c.getEmail(), false, ex.getMessage()));
				}
				continue;
			}

			String subject = templateRenderer.render(subjectTemplate, c);
			String body = templateRenderer.render(bodyTemplate, c);

			if (dryRun) {
				results.add(new SendResult(c.getId(), c.getEmail(), true, "DRY_RUN"));
				continue;
			}

			try {
				MimeMessage message = mailSender.createMimeMessage();
				MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
				helper.setTo(c.getEmail());
				if (fromAddress != null && !fromAddress.isBlank()) {
					helper.setFrom(fromAddress);
				}
				helper.setSubject(subject == null ? "" : subject);
				helper.setText(body == null ? "" : body, isHtml);
				mailSender.send(message);
				results.add(new SendResult(c.getId(), c.getEmail(), true, null));
			} catch (Exception ex) {
				results.add(new SendResult(c.getId(), c.getEmail(), false, ex.getMessage()));
			}
		}

		long ok = results.stream().filter(SendResult::success).count();
		return new SendSummary(results, ok, results.size() - ok);
	}

	private static Map<String, Object> toContactPayload(ProcessedContact c) {
		Map<String, Object> payload = new HashMap<>();
		payload.put("id", c.getId());
		payload.put("name", c.getName());
		payload.put("email", c.getEmail());
		payload.put("company", c.getCompany());
		payload.put("phone", c.getPhone());
		payload.put("phone_formatted", c.getPhoneFormatted());
		payload.put("title", c.getTitle());
		payload.put("city", c.getCity());
		payload.put("state", c.getState());
		payload.put("country", c.getCountry());
		payload.put("website", c.getWebsite());
		return payload;
	}

	private enum DeliveryMode {
		SMTP,
		N8N;

		static DeliveryMode from(String raw) {
			if (raw == null || raw.isBlank()) {
				return SMTP;
			}
			String v = raw.trim().toUpperCase();
			return switch (v) {
				case "SMTP" -> SMTP;
				case "N8N" -> N8N;
				default -> throw new IllegalArgumentException("Unknown delivery_mode: " + raw);
			};
		}
	}

	public record RenderedEmail(UUID contact_id, String to_email, String subject, String body) {
	}

	public record SendResult(UUID contact_id, String to_email, boolean success, String error) {
	}

	public record SendSummary(List<SendResult> results, long success_count, long failure_count) {
	}
}
