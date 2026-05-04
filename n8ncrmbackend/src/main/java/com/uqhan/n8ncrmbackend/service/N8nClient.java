package com.uqhan.n8ncrmbackend.service;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Issue #5: Added connection and read timeouts so webhook calls don't
 * block the thread indefinitely when n8n is slow or unavailable.
 */
@Component
public class N8nClient {
	private final RestClient restClient;
	private final ObjectMapper objectMapper;
	private final String crmWebhookUrl;
	private final String chatWebhookUrl;
	private final String emailWebhookUrl;

	public N8nClient(
			ObjectMapper objectMapper,
			@Value("${n8n.webhook.crm.url}") String crmWebhookUrl,
			@Value("${n8n.webhook.chat.url}") String chatWebhookUrl,
			@Value("${n8n.webhook.email.url:}") String emailWebhookUrl,
			@Value("${n8n.webhook.connect-timeout:5s}") Duration connectTimeout,
			@Value("${n8n.webhook.read-timeout:60s}") Duration readTimeout
	) {
		SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
		requestFactory.setConnectTimeout((int) connectTimeout.toMillis());
		requestFactory.setReadTimeout((int) readTimeout.toMillis());
		this.restClient = RestClient.builder()
				.requestFactory(requestFactory)
				.build();
		this.objectMapper = objectMapper;
		this.crmWebhookUrl = crmWebhookUrl;
		this.chatWebhookUrl = chatWebhookUrl;
		this.emailWebhookUrl = emailWebhookUrl;
	}

	public JsonNode callCrmWorkflow(Map<String, Object> payload) {
		String raw = restClient.post()
				.uri(crmWebhookUrl)
				.contentType(MediaType.APPLICATION_JSON)
				.body(payload)
				.retrieve()
				.body(String.class);
		try {
			return objectMapper.readTree(raw == null || raw.isBlank() ? "{}" : raw);
		} catch (IOException e) {
			throw new IllegalStateException("Failed to parse n8n CRM workflow response", e);
		}
	}

	public JsonNode callChatWorkflow(Map<String, Object> payload) {
		String raw = restClient.post()
				.uri(chatWebhookUrl)
				.contentType(MediaType.APPLICATION_JSON)
				.body(payload)
				.retrieve()
				.body(String.class);
		try {
			return objectMapper.readTree(raw == null || raw.isBlank() ? "{}" : raw);
		} catch (IOException e) {
			throw new IllegalStateException("Failed to parse n8n chat workflow response", e);
		}
	}

	public JsonNode callEmailWorkflow(Map<String, Object> payload) {
		if (emailWebhookUrl == null || emailWebhookUrl.isBlank()) {
			throw new IllegalStateException("n8n email webhook is not configured. Set N8N_EMAIL_WEBHOOK_URL (n8n.webhook.email.url).");
		}
		String raw = restClient.post()
				.uri(emailWebhookUrl)
				.contentType(MediaType.APPLICATION_JSON)
				.body(payload)
				.retrieve()
				.body(String.class);
		try {
			return objectMapper.readTree(raw == null || raw.isBlank() ? "{}" : raw);
		} catch (IOException e) {
			throw new IllegalStateException("Failed to parse n8n email workflow response", e);
		}
	}
}
