package com.uqhan.n8ncrmbackend.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.JsonNode;
import com.uqhan.n8ncrmbackend.entity.ChatMessage;
import com.uqhan.n8ncrmbackend.entity.ChatSession;
import com.uqhan.n8ncrmbackend.repo.ChatMessageRepository;
import com.uqhan.n8ncrmbackend.repo.ChatSessionRepository;

@Service
public class ChatService {
	private final ChatSessionRepository sessionRepository;
	private final ChatMessageRepository messageRepository;
	private final N8nClient n8nClient;

	public ChatService(
			ChatSessionRepository sessionRepository,
			ChatMessageRepository messageRepository,
			N8nClient n8nClient
	) {
		this.sessionRepository = sessionRepository;
		this.messageRepository = messageRepository;
		this.n8nClient = n8nClient;
	}

	@Transactional
	public ChatSession createSession() {
		return sessionRepository.save(new ChatSession());
	}

	@Transactional(readOnly = true)
	public List<ChatMessage> getMessages(UUID sessionId) {
		return messageRepository.findBySession_IdOrderByCreatedAtAsc(sessionId);
	}

	@Transactional
	public ChatMessage sendMessage(UUID sessionId, String content) {
		ChatSession session = sessionRepository.findById(sessionId)
				.orElseThrow(() -> new IllegalArgumentException("Session not found"));

		ChatMessage user = new ChatMessage();
		user.setSession(session);
		user.setRole(ChatMessage.Role.user);
		user.setContent(content);
		messageRepository.save(user);

		List<ChatMessage> recent = messageRepository.findRecent(sessionId, PageRequest.of(0, 5));
		// recent comes DESC; n8n context usually expects oldest->newest
		recent = new ArrayList<>(recent);
		Collections.reverse(recent);

		Map<String, Object> payload = new HashMap<>();
		payload.put("sessionId", sessionId.toString());
		payload.put("action", "sendMessage");
		payload.put("chatInput", content);
		payload.put("context", Map.of(
				"previousMessages", recent.stream().map(m -> Map.of(
						"role", m.getRole().name(),
						"content", m.getContent()
				)).toList()
		));

		JsonNode response = n8nClient.callChatWorkflow(payload);
		String output = response.has("output") ? response.get("output").asText() : null;
		if (output == null || output.isBlank()) {
			output = "Unable to process your request";
		}

		ChatMessage assistant = new ChatMessage();
		assistant.setSession(session);
		assistant.setRole(ChatMessage.Role.assistant);
		assistant.setContent(output);
		return messageRepository.save(assistant);
	}

	@Transactional
	public void deleteSession(UUID sessionId) {
		sessionRepository.deleteById(sessionId);
	}
}
