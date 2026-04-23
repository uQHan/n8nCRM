package com.uqhan.n8ncrmbackend.service;

import java.io.IOException;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class N8nClient {
	private final RestClient restClient;
	private final ObjectMapper objectMapper;
	private final String crmWebhookUrl;
	private final String chatWebhookUrl;

	public N8nClient(
			ObjectMapper objectMapper,
			@Value("${n8n.webhook.crm.url}") String crmWebhookUrl,
			@Value("${n8n.webhook.chat.url}") String chatWebhookUrl
	) {
		this.restClient = RestClient.create();
		this.objectMapper = objectMapper;
		this.crmWebhookUrl = crmWebhookUrl;
		this.chatWebhookUrl = chatWebhookUrl;
	}

	public JsonNode callCrmWorkflow(Map<String, Object> payload) {
		String raw = restClient.post()
				.uri(crmWebhookUrl)
				.contentType(MediaType.APPLICATION_JSON)
				.body(payload)
				.retrieve()
				.body(String.class);
		try {
			return objectMapper.readTree(raw == null ? "{}" : raw);
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
			return objectMapper.readTree(raw == null ? "{}" : raw);
		} catch (IOException e) {
			throw new IllegalStateException("Failed to parse n8n chat workflow response", e);
		}
	}
}
