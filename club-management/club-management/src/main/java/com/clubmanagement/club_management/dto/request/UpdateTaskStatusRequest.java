package com.clubmanagement.club_management.dto.request;

import com.clubmanagement.club_management.entity.Task.TaskStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateTaskStatusRequest {
    @NotNull(message = "Task status is required")
    private TaskStatus status;
}
