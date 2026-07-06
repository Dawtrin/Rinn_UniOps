package com.clubmanagement.club_management.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AssignMemberRequest {
    @NotNull(message = "User ID is required")
    private Long userId;

    @NotNull(message = "Team ID is required")
    private Long teamId;
}
