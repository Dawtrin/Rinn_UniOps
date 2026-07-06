package com.clubmanagement.club_management.dto.request;

import com.clubmanagement.club_management.entity.Event.EventStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateEventStatusRequest {
    @NotNull(message = "Status is required")
    private EventStatus status;

    private String note;
}
