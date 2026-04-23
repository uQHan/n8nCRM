package com.uqhan.n8ncrmbackend.web;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.uqhan.n8ncrmbackend.entity.ChatMessage;
import com.uqhan.n8ncrmbackend.entity.ChatSession;
import com.uqhan.n8ncrmbackend.service.ChatService;
import com.uqhan.n8ncrmbackend.web.dto.ApiChatMessage;
import com.uqhan.n8ncrmbackend.web.dto.ChatSendMessageRequest;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/chat")
public class ChatController {
	private final ChatService chatService;

	public ChatController(ChatService chatService) {
		this.chatService = chatService;
	}

	@PostMapping("/sessions")
	public Map<String, String> createSession() {
		ChatSession session = chatService.createSession();
		return Map.of("id", session.getId().toString());
	}

	@GetMapping("/sessions/{sessionId}/messages")
	public List<ApiChatMessage> getMessages(@PathVariable UUID sessionId) {
		return chatService.getMessages(sessionId).stream().map(ApiChatMessage::from).toList();
	}

	@PostMapping("/sessions/{sessionId}/messages")
	public ApiChatMessage sendMessage(
			@PathVariable UUID sessionId,
			@Valid @RequestBody ChatSendMessageRequest req
	) {
		ChatMessage assistant = chatService.sendMessage(sessionId, req.content());
		return ApiChatMessage.from(assistant);
	}

	@DeleteMapping("/sessions/{sessionId}")
	public void deleteSession(@PathVariable UUID sessionId) {
		chatService.deleteSession(sessionId);
	}
}
