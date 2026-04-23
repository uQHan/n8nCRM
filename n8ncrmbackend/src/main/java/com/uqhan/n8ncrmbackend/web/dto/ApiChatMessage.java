package com.uqhan.n8ncrmbackend.web.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

import com.uqhan.n8ncrmbackend.entity.ChatMessage;

public record ApiChatMessage(
		UUID id,
		String role,
		String content,
		OffsetDateTime timestamp
) {
	public static ApiChatMessage from(ChatMessage m) {
		return new ApiChatMessage(m.getId(), m.getRole().name(), m.getContent(), m.getCreatedAt());
	}
}
