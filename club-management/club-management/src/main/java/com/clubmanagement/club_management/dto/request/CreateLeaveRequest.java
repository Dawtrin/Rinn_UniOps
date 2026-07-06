package com.clubmanagement.club_management.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateLeaveRequest {
    @NotNull(message = "Session ID is required")
    private Long sessionId;
    
    @NotBlank(message = "Reason is required")
    private String reason;
}
