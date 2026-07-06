package com.clubmanagement.club_management.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AiSummarizeRequest {
    @NotBlank(message = "Content is required")
    private String content;
}
