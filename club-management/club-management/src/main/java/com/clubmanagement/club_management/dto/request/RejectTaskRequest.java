package com.clubmanagement.club_management.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RejectTaskRequest {
    @NotBlank(message = "Reject reason is required")
    private String rejectReason;
}
