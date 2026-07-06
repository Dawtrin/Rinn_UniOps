package com.clubmanagement.club_management.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TeamMemberRequest {
    @NotNull(message = "User ID is required")
    private Long userId;
}
