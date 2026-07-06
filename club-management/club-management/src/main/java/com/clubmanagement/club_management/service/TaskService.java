package com.clubmanagement.club_management.service;

import com.clubmanagement.club_management.dto.request.CreateTaskRequest;
import com.clubmanagement.club_management.dto.response.TaskResponse;
import com.clubmanagement.club_management.dto.response.UserResponse;
import com.clubmanagement.club_management.entity.Event;
import com.clubmanagement.club_management.entity.Notification;
import com.clubmanagement.club_management.entity.Task;
import com.clubmanagement.club_management.entity.User;
import com.clubmanagement.club_management.exception.BadRequestException;
import com.clubmanagement.club_management.exception.ResourceNotFoundException;
import com.clubmanagement.club_management.repository.EventRepository;
import com.clubmanagement.club_management.repository.TaskRepository;
import com.clubmanagement.club_management.repository.UserRepository;
import com.clubmanagement.club_management.repository.DepartmentRepository;
import com.clubmanagement.club_management.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.clubmanagement.club_management.service.EmailService;

import com.clubmanagement.club_management.dto.request.CreateSubTaskRequest;
import com.clubmanagement.club_management.dto.request.CreateTaskCommentRequest;
import com.clubmanagement.club_management.dto.response.SubTaskResponse;
import com.clubmanagement.club_management.dto.response.TaskCommentResponse;
import com.clubmanagement.club_management.entity.*;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final TeamRepository teamRepository;
    private final NotificationService notificationService;
    private final GamificationService gamificationService;
    private final AuditLogService auditLogService;
    private final EmailService emailService;

    public List<TaskResponse> getAllTasks(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getRole() == User.Role.ADMIN) {
            return taskRepository.findAll().stream()
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());
        }

        Long departmentId = user.getDepartment() != null ? user.getDepartment().getId() : null;
        if (departmentId == null) {
            return java.util.Collections.emptyList();
        }

        return taskRepository.findAll().stream()
                .filter(task -> {
                    if (task.getDepartment() != null && task.getDepartment().getId().equals(departmentId)) {
                        return true;
                    }
                    if (task.getEvent() != null && task.getEvent().getDepartment() != null &&
                        task.getEvent().getDepartment().getId().equals(departmentId)) {
                        return true;
                    }
                    return task.getAssignees().stream().anyMatch(assignee -> assignee.getId().equals(user.getId()));
                })
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<TaskResponse> getTasksByEventId(Long eventId) {
        return taskRepository.findByEventId(eventId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<TaskResponse> getMyTasks(String email) {
        User user = userRepository.findByEmail(email).orElseThrow();
        return taskRepository.findByAssignees_Id(user.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public TaskResponse createTask(CreateTaskRequest request, String assignerEmail) {
        User assigner = userRepository.findByEmail(assignerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Assigner not found"));

        Event event = eventRepository.findById(request.getEventId())
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));

        if (assigner.getRole() == User.Role.MANAGER) {
            if (assigner.getDepartment() == null || event.getDepartment() == null ||
                !assigner.getDepartment().getId().equals(event.getDepartment().getId())) {
                throw new BadRequestException("You can only create tasks for events in your own department");
            }
        }

        List<User> assignees = java.util.Collections.emptyList();
        if (request.getAssigneeIds() != null && !request.getAssigneeIds().isEmpty()) {
            assignees = userRepository.findAllById(request.getAssigneeIds());
        }

        com.clubmanagement.club_management.entity.Department department = null;
        if (request.getDepartmentId() != null) {
            department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department not found"));
        }

        com.clubmanagement.club_management.entity.Team team = null;
        if (request.getTeamId() != null) {
            team = teamRepository.findById(request.getTeamId())
                    .orElseThrow(() -> new ResourceNotFoundException("Team not found"));
        }

        if (assignees.isEmpty() && department == null && team == null) {
            throw new BadRequestException("At least one assignee, department, or team is required");
        }

        Task task = Task.builder()
                .event(event)
                .title(request.getTitle())
                .description(request.getDescription())
                .deadline(request.getDeadline())
                .priority(request.getPriority())
                .assignedBy(assigner)
                .status(Task.TaskStatus.TODO)
                .assignees(assignees)
                .department(department)
                .team(team)
                .build();

        Task savedTask = taskRepository.save(task);

        // Send notifications
        assignees.forEach(assignee -> {
            Notification notification = Notification.builder()
                    .user(assignee)
                    .type(Notification.NotificationType.TASK_ASSIGNED)
                    .title("New Task Assigned: " + task.getTitle())
                    .message(assigner.getFullName() + " has assigned you a new task for event: " + event.getTitle())
                    .referenceId(task.getId())
                    .referenceType("TASK")
                    .build();
            notificationService.sendToUser(assignee.getId(), notification);

            // Send Email Notification
            String emailContent = "<h3>Nhiệm vụ mới được phân công</h3>" +
                    "<p>Chào bạn <strong>" + assignee.getFullName() + "</strong>,</p>" +
                    "<p>Bạn đã được phân công một nhiệm vụ mới tại Rin UniOps:</p>" +
                    "<ul>" +
                    "<li><strong>Công việc:</strong> " + task.getTitle() + "</li>" +
                    "<li><strong>Sự kiện:</strong> " + event.getTitle() + "</li>" +
                    "<li><strong>Người giao:</strong> " + assigner.getFullName() + "</li>" +
                    "<li><strong>Hạn chót:</strong> " + (task.getDeadline() != null ? task.getDeadline() : "Không có") + "</li>" +
                    "<li><strong>Độ ưu tiên:</strong> " + task.getPriority() + "</li>" +
                    "</ul>" +
                    "<p>Vui lòng đăng nhập hệ thống để xem chi tiết và cập nhật tiến độ công việc.</p>" +
                    "<hr style='border: none; border-top: 0.5px solid #eaeaea; margin: 20px 0;'/><p style='font-size: 0.8rem; color: #888;'>Hệ thống quản trị câu lạc bộ Rin UniOps</p>";
            emailService.sendHtmlEmail(assignee.getEmail(), "[Club OS] Nhiệm vụ mới: " + task.getTitle(), emailContent);
        });

        auditLogService.log("CREATE_TASK", "Task", savedTask.getId(), "Created task: " + savedTask.getTitle());
        return mapToResponse(savedTask);
    }

    public TaskResponse updateTaskStatus(Long taskId, Task.TaskStatus newStatus, String currentUserEmail) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        User currentUser = userRepository.findByEmail(currentUserEmail).orElseThrow();

        if (currentUser.getRole() == User.Role.MANAGER) {
            if (currentUser.getDepartment() == null || task.getEvent().getDepartment() == null ||
                !currentUser.getDepartment().getId().equals(task.getEvent().getDepartment().getId())) {
                throw new BadRequestException("You can only update tasks in your own department");
            }
        }
        
        // Check if user is assignee
        boolean isAssignee = task.getAssignees().stream().anyMatch(u -> u.getEmail().equals(currentUserEmail));
        if (!isAssignee && currentUser.getRole() == User.Role.MEMBER) {
            throw new BadRequestException("Only assignees or managers can update task status");
        }

        if (currentUser.getRole() == User.Role.MEMBER) {
            if (newStatus == Task.TaskStatus.DONE || newStatus == Task.TaskStatus.REJECTED) {
                throw new BadRequestException("Members cannot directly mark task as DONE or REJECTED. Use approve/reject endpoints.");
            }
            if (newStatus == Task.TaskStatus.TODO && (task.getStatus() == Task.TaskStatus.IN_PROGRESS || task.getStatus() == Task.TaskStatus.REVIEW)) {
                throw new BadRequestException("Members cannot move task backward to TODO.");
            }
        }

        // Reopen rejected task
        if (task.getStatus() == Task.TaskStatus.REJECTED && newStatus == Task.TaskStatus.IN_PROGRESS) {
            task.setRejectReason(null);
        }

        task.setStatus(newStatus);
        Task saved = taskRepository.save(task);
        auditLogService.log("UPDATE_TASK_STATUS", "Task", saved.getId(), "Updated status to " + newStatus + " for task: " + saved.getTitle());
        return mapToResponse(saved);
    }

    public TaskResponse approveTask(Long taskId, String managerEmail) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        User manager = userRepository.findByEmail(managerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Manager not found"));
        if (manager.getRole() == User.Role.MEMBER) {
            throw new BadRequestException("Only managers or admins can approve tasks");
        }
        if (manager.getRole() == User.Role.MANAGER) {
            if (manager.getDepartment() == null || task.getEvent().getDepartment() == null ||
                !manager.getDepartment().getId().equals(task.getEvent().getDepartment().getId())) {
                throw new BadRequestException("You can only approve tasks in your own department");
            }
        }

        if (task.getStatus() != Task.TaskStatus.REVIEW) {
            throw new BadRequestException("Task must be in REVIEW status to be approved");
        }

        task.setStatus(Task.TaskStatus.DONE);
        
        // Gamification: +20 XP cho mỗi assignee khi hoàn thành Task
        task.getAssignees().forEach(assignee -> {
            gamificationService.addXp(assignee, 20, "Hoàn thành nhiệm vụ: " + task.getTitle());
        });
        
        Task saved = taskRepository.save(task);
        auditLogService.log("APPROVE_TASK", "Task", saved.getId(), "Approved task: " + saved.getTitle());
        return mapToResponse(saved);
    }

    public TaskResponse rejectTask(Long taskId, String rejectReason, String managerEmail) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        User manager = userRepository.findByEmail(managerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Manager not found"));
        if (manager.getRole() == User.Role.MEMBER) {
            throw new BadRequestException("Only managers or admins can reject tasks");
        }
        if (manager.getRole() == User.Role.MANAGER) {
            if (manager.getDepartment() == null || task.getEvent().getDepartment() == null ||
                !manager.getDepartment().getId().equals(task.getEvent().getDepartment().getId())) {
                throw new BadRequestException("You can only reject tasks in your own department");
            }
        }

        if (task.getStatus() != Task.TaskStatus.REVIEW) {
            throw new BadRequestException("Task must be in REVIEW status to be rejected");
        }

        task.setStatus(Task.TaskStatus.REJECTED);
        task.setRejectReason(rejectReason);
        Task savedTask = taskRepository.save(task);

        // Notify assignees
        task.getAssignees().forEach(assignee -> {
            Notification notification = Notification.builder()
                    .user(assignee)
                    .type(Notification.NotificationType.TASK_REJECTED)
                    .title("Task Rejected: " + task.getTitle())
                    .message("Reason: " + rejectReason)
                    .referenceId(task.getId())
                    .referenceType("TASK")
                    .build();
            notificationService.sendToUser(assignee.getId(), notification);
        });

        auditLogService.log("REJECT_TASK", "Task", savedTask.getId(), "Rejected task: " + savedTask.getTitle() + " with reason: " + rejectReason);
        return mapToResponse(savedTask);
    }

    public TaskResponse addSubTask(Long taskId, CreateSubTaskRequest request, String email) {
        Task task = taskRepository.findById(taskId).orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        verifyTaskWriteAccess(task, email);
        SubTask subTask = SubTask.builder()
                .task(task)
                .title(request.getTitle())
                .build();
        task.getSubTasks().add(subTask);
        Task saved = taskRepository.save(task);
        auditLogService.log("ADD_SUBTASK", "Task", saved.getId(), "Added subtask: " + request.getTitle() + " to task: " + saved.getTitle());
        return mapToResponse(saved);
    }

    public TaskResponse toggleSubTask(Long taskId, Long subTaskId, String email) {
        Task task = taskRepository.findById(taskId).orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        verifyTaskWriteAccess(task, email);
        SubTask subTask = task.getSubTasks().stream()
                .filter(st -> st.getId().equals(subTaskId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Subtask not found"));
        
        subTask.setCompleted(!subTask.isCompleted());
        return mapToResponse(taskRepository.save(task));
    }

    public TaskResponse addComment(Long taskId, CreateTaskCommentRequest request, String email) {
        Task task = taskRepository.findById(taskId).orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        verifyTaskWriteAccess(task, email);
        User user = userRepository.findByEmail(email).orElseThrow();
        
        TaskComment comment = TaskComment.builder()
                .task(task)
                .user(user)
                .content(request.getContent())
                .build();
                
        task.getComments().add(comment);
        Task savedTask = taskRepository.save(task);
        
        // Gamification: +2 XP for discussion
        gamificationService.addXp(user, 2, "Bình luận trao đổi công việc");
        
        auditLogService.log("ADD_TASK_COMMENT", "Task", savedTask.getId(), "Added comment to task: " + savedTask.getTitle());
        return mapToResponse(savedTask);
    }

    @org.springframework.transaction.annotation.Transactional
    public TaskResponse updateTask(Long id, CreateTaskRequest request, String email) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getRole() == User.Role.MANAGER) {
            if (user.getDepartment() == null || task.getEvent().getDepartment() == null ||
                !user.getDepartment().getId().equals(task.getEvent().getDepartment().getId())) {
                throw new BadRequestException("You can only update tasks in your own department");
            }
        }

        if (request.getTitle() != null) task.setTitle(request.getTitle());
        if (request.getDescription() != null) task.setDescription(request.getDescription());
        if (request.getDeadline() != null) task.setDeadline(request.getDeadline());
        if (request.getPriority() != null) task.setPriority(request.getPriority());

        if (request.getEventId() != null) {
            Event event = eventRepository.findById(request.getEventId())
                    .orElseThrow(() -> new ResourceNotFoundException("Event not found"));
            task.setEvent(event);
        }

        if (request.getAssigneeIds() != null && !request.getAssigneeIds().isEmpty()) {
            List<User> assignees = userRepository.findAllById(request.getAssigneeIds());
            if (!assignees.isEmpty()) {
                task.setAssignees(assignees);
            }
        } else if (request.getAssigneeIds() != null) {
            task.setAssignees(java.util.Collections.emptyList());
        }

        if (request.getDepartmentId() != null) {
            com.clubmanagement.club_management.entity.Department department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department not found"));
            task.setDepartment(department);
        } else {
            task.setDepartment(null);
        }

        if (request.getTeamId() != null) {
            com.clubmanagement.club_management.entity.Team team = teamRepository.findById(request.getTeamId())
                    .orElseThrow(() -> new ResourceNotFoundException("Team not found"));
            task.setTeam(team);
        } else {
            task.setTeam(null);
        }

        Task saved = taskRepository.save(task);
        auditLogService.log("UPDATE_TASK", "Task", saved.getId(), "Updated task: " + saved.getTitle());
        return mapToResponse(saved);
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteTask(Long id, String email) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getRole() == User.Role.MANAGER) {
            if (user.getDepartment() == null || task.getEvent().getDepartment() == null ||
                !user.getDepartment().getId().equals(task.getEvent().getDepartment().getId())) {
                throw new BadRequestException("You can only delete tasks in your own department");
            }
        }
        taskRepository.delete(task);
        auditLogService.log("DELETE_TASK", "Task", id, "Deleted task ID: " + id + ", Title: " + task.getTitle());
    }

    private TaskResponse mapToResponse(Task task) {
        List<UserResponse> assigneeResponses = task.getAssignees().stream()
                .map(user -> UserResponse.builder()
                        .id(user.getId())
                        .fullName(user.getFullName())
                        .email(user.getEmail())
                        .avatarUrl(user.getAvatarUrl())
                        .build())
                .collect(Collectors.toList());

        List<SubTaskResponse> subTaskResponses = task.getSubTasks().stream()
                .map(st -> SubTaskResponse.builder()
                        .id(st.getId())
                        .title(st.getTitle())
                        .completed(st.isCompleted())
                        .build())
                .collect(Collectors.toList());

        List<TaskCommentResponse> commentResponses = task.getComments().stream()
                .map(c -> TaskCommentResponse.builder()
                        .id(c.getId())
                        .userId(c.getUser().getId())
                        .userName(c.getUser().getFullName())
                        .avatarUrl(c.getUser().getAvatarUrl())
                        .content(c.getContent())
                        .createdAt(c.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return TaskResponse.builder()
                .id(task.getId())
                .eventId(task.getEvent().getId())
                .eventTitle(task.getEvent().getTitle())
                .title(task.getTitle())
                .description(task.getDescription())
                .deadline(task.getDeadline())
                .status(task.getStatus().name())
                .priority(task.getPriority().name())
                .assignedById(task.getAssignedBy().getId())
                .assignedByName(task.getAssignedBy().getFullName())
                .rejectReason(task.getRejectReason())
                .departmentId(task.getDepartment() != null ? task.getDepartment().getId() : null)
                .departmentName(task.getDepartment() != null ? task.getDepartment().getName() : null)
                .teamId(task.getTeam() != null ? task.getTeam().getId() : null)
                .teamName(task.getTeam() != null ? task.getTeam().getName() : null)
                .assignees(assigneeResponses)
                .subTasks(subTaskResponses)
                .comments(commentResponses)
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .build();
    }

    private void verifyTaskWriteAccess(Task task, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getRole() == User.Role.ADMIN) {
            return;
        }
        if (user.getRole() == User.Role.MANAGER) {
            if (user.getDepartment() != null && task.getEvent().getDepartment() != null &&
                user.getDepartment().getId().equals(task.getEvent().getDepartment().getId())) {
                return;
            }
            throw new BadRequestException("You can only modify tasks in your own department");
        }
        // MEMBER: must be an assignee
        boolean isAssignee = task.getAssignees().stream().anyMatch(u -> u.getEmail().equals(email));
        if (!isAssignee) {
            throw new BadRequestException("Only assignees or managers can modify task subtasks or comments");
        }
    }
}
