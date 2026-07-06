package com.clubmanagement.club_management.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateUserRequest {
    @NotBlank(message = "Full name is required")
    private String fullName;

    private String phone;

    @NotBlank(message = "Role is required")
    private String role;

    private Long departmentId;

    @NotNull(message = "isActive status is required")
    private Boolean isActive;

    private String email;
    private String password;
}
