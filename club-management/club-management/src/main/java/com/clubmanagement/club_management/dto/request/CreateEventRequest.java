package com.clubmanagement.club_management.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CreateEventRequest {
    @NotBlank(message = "Title is required")
    private String title;

    private String description;
    
    private String location;

    @NotNull(message = "Start time is required")
    private LocalDateTime startTime;

    @NotNull(message = "End time is required")
    private LocalDateTime endTime;

    @NotNull(message = "Department ID is required")
    private Long departmentId;

    private Boolean isPublic = false;
}
