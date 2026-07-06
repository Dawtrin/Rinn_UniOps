package com.clubmanagement.club_management.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskResponse {
    private Long id;
    private Long eventId;
    private String eventTitle;
    private String title;
    private String description;
    private LocalDateTime deadline;
    private String status;
    private String priority;
    private Long assignedById;
    private String assignedByName;
    private String rejectReason;
    private Long departmentId;
    private String departmentName;
    private Long teamId;
    private String teamName;
    private List<UserResponse> assignees;
    private List<SubTaskResponse> subTasks;
    private List<TaskCommentResponse> comments;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
