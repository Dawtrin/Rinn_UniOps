package com.clubmanagement.club_management.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateTaskCommentRequest {
    @NotBlank(message = "Comment content cannot be empty")
    private String content;
}
