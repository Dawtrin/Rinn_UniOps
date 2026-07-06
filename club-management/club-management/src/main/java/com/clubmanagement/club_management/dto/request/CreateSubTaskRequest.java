package com.clubmanagement.club_management.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateSubTaskRequest {
    @NotBlank(message = "Title is required")
    private String title;
}
