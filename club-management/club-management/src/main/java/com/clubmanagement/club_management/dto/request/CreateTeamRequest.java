package com.clubmanagement.club_management.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateTeamRequest {
    @NotBlank(message = "Team name is required")
    private String name;

    private String description;

    @NotNull(message = "Department ID is required")
    private Long departmentId;

    private Long leaderId;

    private String avatarColor;
}
