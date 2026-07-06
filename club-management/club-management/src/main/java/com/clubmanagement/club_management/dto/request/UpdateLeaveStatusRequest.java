package com.clubmanagement.club_management.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateLeaveStatusRequest {
    @NotBlank(message = "Status is required")
    private String status;

    private String rejectReason;
}
