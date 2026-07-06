package com.clubmanagement.club_management.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalTime;

@Data
public class CreateSlotRequest {
    @NotNull(message = "Day of week is required")
    private Integer dayOfWeek;

    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    private LocalTime endTime;

    @NotBlank(message = "Title is required")
    private String title;

    private String location;
    private String type;
    private String color;
    private String notes;
}
