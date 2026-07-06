package com.clubmanagement.club_management.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateScheduleRequest {
    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Scope type is required")
    private String scopeType;

    @NotNull(message = "Scope ID is required")
    private Long scopeId;

    @NotNull(message = "Week start date is required")
    private LocalDate weekStart;
}
