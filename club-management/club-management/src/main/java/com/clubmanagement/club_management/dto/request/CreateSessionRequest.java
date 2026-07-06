package com.clubmanagement.club_management.dto.request;

import com.clubmanagement.club_management.entity.EventSession.SessionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class CreateSessionRequest {
    // eventId is injected from @PathVariable by the controller (not required in request body)
    private Long eventId;

    @NotBlank(message = "Title is required")
    private String title;

    @NotNull(message = "Session date is required")
    private LocalDate sessionDate;

    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    private LocalTime endTime;

    private String location;

    @NotNull(message = "Session type is required")
    private SessionType type;

    private String notes;
}
