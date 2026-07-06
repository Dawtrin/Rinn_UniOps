package com.clubmanagement.club_management.controller;

import com.clubmanagement.club_management.dto.request.CreateTaskRequest;
import com.clubmanagement.club_management.dto.request.RejectTaskRequest;
import com.clubmanagement.club_management.dto.request.UpdateTaskStatusRequest;
import com.clubmanagement.club_management.dto.response.ApiResponse;
import com.clubmanagement.club_management.dto.response.TaskResponse;
import com.clubmanagement.club_management.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getAllTasks(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Tasks retrieved successfully", taskService.getAllTasks(authentication.getName())));
    }

    @GetMapping("/my-tasks")
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getMyTasks(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("My tasks retrieved successfully", taskService.getMyTasks(authentication.getName())));
    }

    @GetMapping("/event/{eventId}")
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getTasksByEventId(@PathVariable Long eventId) {
        return ResponseEntity.ok(ApiResponse.success("Tasks retrieved successfully", taskService.getTasksByEventId(eventId)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<TaskResponse>> createTask(
            @Valid @RequestBody CreateTaskRequest request,
            Authentication authentication) {
        TaskResponse response = taskService.createTask(request, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Task created successfully", response));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<TaskResponse>> updateTaskStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTaskStatusRequest request,
            Authentication authentication) {
        TaskResponse response = taskService.updateTaskStatus(id, request.getStatus(), authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Task status updated successfully", response));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<TaskResponse>> approveTask(
            @PathVariable Long id,
            Authentication authentication) {
        TaskResponse response = taskService.approveTask(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Task approved successfully", response));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<TaskResponse>> rejectTask(
            @PathVariable Long id,
            @Valid @RequestBody RejectTaskRequest request,
            Authentication authentication) {
        TaskResponse response = taskService.rejectTask(id, request.getRejectReason(), authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Task rejected successfully", response));
    }

    @PostMapping("/{id}/subtasks")
    public ResponseEntity<ApiResponse<TaskResponse>> addSubTask(
            @PathVariable Long id,
            @Valid @RequestBody com.clubmanagement.club_management.dto.request.CreateSubTaskRequest request,
            Authentication authentication) {
        TaskResponse response = taskService.addSubTask(id, request, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Subtask added", response));
    }

    @PutMapping("/{id}/subtasks/{subTaskId}/toggle")
    public ResponseEntity<ApiResponse<TaskResponse>> toggleSubTask(
            @PathVariable Long id,
            @PathVariable Long subTaskId,
            Authentication authentication) {
        TaskResponse response = taskService.toggleSubTask(id, subTaskId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Subtask toggled", response));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<TaskResponse>> addComment(
            @PathVariable Long id,
            @Valid @RequestBody com.clubmanagement.club_management.dto.request.CreateTaskCommentRequest request,
            Authentication authentication) {
        TaskResponse response = taskService.addComment(id, request, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Comment added", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<TaskResponse>> updateTask(
            @PathVariable Long id,
            @Valid @RequestBody CreateTaskRequest request,
            Authentication authentication) {
        TaskResponse response = taskService.updateTask(id, request, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Task updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteTask(
            @PathVariable Long id,
            Authentication authentication) {
        taskService.deleteTask(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Task deleted successfully"));
    }
}
