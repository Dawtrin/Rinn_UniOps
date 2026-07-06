package com.clubmanagement.club_management.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AiChatRequest {
    @NotBlank(message = "Message is required")
    private String message;
}
