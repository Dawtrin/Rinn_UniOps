package com.clubmanagement.club_management.dto.request;

import com.clubmanagement.club_management.entity.Task.Priority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class CreateTaskRequest {
    @NotNull(message = "Event ID is required")
    private Long eventId;

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotNull(message = "Deadline is required")
    private LocalDateTime deadline;

    private Priority priority = Priority.MEDIUM;

    private List<Long> assigneeIds;

    private Long departmentId;

    private Long teamId;
}
