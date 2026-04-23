package com.uqhan.n8ncrmbackend.web.dto;

import jakarta.validation.constraints.NotBlank;

public record ChatSendMessageRequest(@NotBlank String content) {
}
