package com.clubmanagement.club_management.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CheckInRequest {
    @NotNull(message = "Session ID is required")
    private Long sessionId;
    
    private String note;
}
