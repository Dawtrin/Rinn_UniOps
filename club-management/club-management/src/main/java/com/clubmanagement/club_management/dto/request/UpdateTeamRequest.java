package com.clubmanagement.club_management.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateTeamRequest {
    @NotBlank(message = "Team name is required")
    private String name;

    private String description;

    private String avatarColor;
}
