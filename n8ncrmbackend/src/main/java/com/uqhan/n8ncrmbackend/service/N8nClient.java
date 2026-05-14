package com.uqhan.n8ncrmbackend.service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Issue #5: Added connection and read timeouts so webhook calls don't
 * block the thread indefinitely when n8n is slow or unavailable.
 */
@Component
public class N8nClient {
	private static final Logger log = LoggerFactory.getLogger(N8nClient.class);
	private static final int LOG_BODY_SNIPPET_LIMIT = 800;

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
		return callWebhook("crm", crmWebhookUrl, payload);
	}

	public JsonNode callChatWorkflow(Map<String, Object> payload) {
		return callWebhook("chat", chatWebhookUrl, payload);
	}

	public JsonNode callEmailWorkflow(Map<String, Object> payload) {
		if (emailWebhookUrl == null || emailWebhookUrl.isBlank()) {
			throw new IllegalStateException("n8n email webhook is not configured. Set N8N_EMAIL_WEBHOOK_URL (n8n.webhook.email.url).");
		}
		return callWebhook("email", emailWebhookUrl, payload);
	}

	private JsonNode callWebhook(String label, String url, Map<String, Object> payload) {
		try {
			return restClient.post()
					.uri(url)
					.contentType(MediaType.APPLICATION_JSON)
					.body(payload)
					.exchange((request, response) -> parseJsonResponse(label, url, response));
		} catch (RestClientResponseException e) {
			String body = e.getResponseBodyAsString();
			log.warn(
					"n8n {} webhook call failed: status={} url={} bodySnippet={}",
					label,
					e.getStatusCode().value(),
					url,
					snippet(body == null ? "" : body)
			);
			throw e;
		}
	}

	private JsonNode parseJsonResponse(String label, String url, ClientHttpResponse response) throws IOException {
		HttpStatusCode status = response.getStatusCode();
		MediaType contentType = response.getHeaders().getContentType();
		byte[] bytes = response.getBody().readAllBytes();
		String raw = bytes.length == 0 ? "" : new String(bytes, StandardCharsets.UTF_8);

		if (!status.is2xxSuccessful()) {
			log.warn(
					"n8n {} webhook returned non-2xx: status={} url={} contentType={} bodySnippet={}",
					label,
					status.value(),
					url,
					contentType,
					snippet(raw)
			);
			throw new IllegalStateException("n8n " + label + " webhook returned HTTP " + status.value());
		}

		log.debug(
				"n8n {} webhook response: status={} url={} contentType={} bytes={} bodySnippet={}",
				label,
				status.value(),
				url,
				contentType,
				bytes.length,
				snippet(raw)
		);

		try {
			return objectMapper.readTree(raw.isBlank() ? "{}" : raw);
		} catch (IOException e) {
			log.warn(
					"Failed to parse n8n {} webhook response as JSON: url={} contentType={} bytes={} bodySnippet={}",
					label,
					url,
					contentType,
					bytes.length,
					snippet(raw)
			);
			throw e;
		}
	}

	private static String snippet(String raw) {
		String s = raw.replaceAll("\\s+", " ").trim();
		if (s.length() <= LOG_BODY_SNIPPET_LIMIT) return s;
		return s.substring(0, LOG_BODY_SNIPPET_LIMIT) + "…";
	}
}
