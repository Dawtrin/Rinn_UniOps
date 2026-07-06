package com.clubmanagement.club_management.service;

import com.clubmanagement.club_management.dto.request.CreateEventRequest;
import com.clubmanagement.club_management.dto.response.EventResponse;
import com.clubmanagement.club_management.entity.Department;
import com.clubmanagement.club_management.entity.Event;
import com.clubmanagement.club_management.entity.Notification;
import com.clubmanagement.club_management.entity.User;
import com.clubmanagement.club_management.exception.BadRequestException;
import com.clubmanagement.club_management.exception.ResourceNotFoundException;
import com.clubmanagement.club_management.repository.DepartmentRepository;
import com.clubmanagement.club_management.repository.EventRepository;
import com.clubmanagement.club_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    public List<EventResponse> getAllEvents(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getRole() == User.Role.ADMIN) {
            return eventRepository.findAll().stream()
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());
        }

        Long departmentId = user.getDepartment() != null ? user.getDepartment().getId() : null;
        if (departmentId == null) {
            return java.util.Collections.emptyList();
        }

        return eventRepository.findByDepartmentId(departmentId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    public EventResponse getEventById(Long id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with ID: " + id));
        return mapToResponse(event);
    }

    public EventResponse createEvent(CreateEventRequest request, String currentUserEmail) {
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found"));

        if (currentUser.getRole() == User.Role.MANAGER) {
            if (currentUser.getDepartment() == null || !currentUser.getDepartment().getId().equals(department.getId())) {
                throw new BadRequestException("You can only create events for your own department");
            }
        }

        Event event = Event.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .location(request.getLocation())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .department(department)
                .createdBy(currentUser)
                .status(Event.EventStatus.DRAFT)
                .isPublic(request.getIsPublic() != null ? request.getIsPublic() : false)
                .build();

        Event savedEvent = eventRepository.save(event);

        if (savedEvent.getStatus() != Event.EventStatus.DRAFT) {
            notifyDepartmentMembers(department, savedEvent, Notification.NotificationType.NEW_EVENT, "New Event Created: " + savedEvent.getTitle());
        }

        auditLogService.log("CREATE_EVENT", "Event", savedEvent.getId(), "Created event: " + savedEvent.getTitle());
        return mapToResponse(savedEvent);
    }

    @org.springframework.transaction.annotation.Transactional
    public EventResponse updateEvent(Long id, CreateEventRequest request, String currentUserEmail) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with ID: " + id));

        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (currentUser.getRole() == User.Role.MANAGER) {
            if (currentUser.getDepartment() == null || event.getDepartment() == null || 
                !currentUser.getDepartment().getId().equals(event.getDepartment().getId())) {
                throw new BadRequestException("You can only update events in your own department");
            }
            if (request.getDepartmentId() != null && !request.getDepartmentId().equals(currentUser.getDepartment().getId())) {
                throw new BadRequestException("You cannot move an event to another department");
            }
        }

        if (request.getTitle() != null) event.setTitle(request.getTitle());
        if (request.getDescription() != null) event.setDescription(request.getDescription());
        if (request.getLocation() != null) event.setLocation(request.getLocation());
        if (request.getStartTime() != null) event.setStartTime(request.getStartTime());
        if (request.getEndTime() != null) event.setEndTime(request.getEndTime());
        if (request.getIsPublic() != null) event.setIsPublic(request.getIsPublic());

        if (request.getDepartmentId() != null) {
            Department department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department not found"));
            event.setDepartment(department);
        }

        Event saved = eventRepository.save(event);
        auditLogService.log("UPDATE_EVENT", "Event", saved.getId(), "Updated event details for: " + saved.getTitle());
        return mapToResponse(saved);
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteEvent(Long id, String currentUserEmail) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with ID: " + id));

        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (currentUser.getRole() == User.Role.MANAGER) {
            if (currentUser.getDepartment() == null || event.getDepartment() == null || 
                !currentUser.getDepartment().getId().equals(event.getDepartment().getId())) {
                throw new BadRequestException("You can only delete events in your own department");
            }
        }

        eventRepository.delete(event);
        auditLogService.log("DELETE_EVENT", "Event", id, "Deleted event ID: " + id + ", Title: " + event.getTitle());
    }

    public EventResponse updateEventStatus(Long eventId, Event.EventStatus newStatus, String note, String currentUserEmail) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));

        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (currentUser.getRole() == User.Role.MANAGER) {
            if (currentUser.getDepartment() == null || event.getDepartment() == null || 
                !currentUser.getDepartment().getId().equals(event.getDepartment().getId())) {
                throw new BadRequestException("You can only update events in your own department");
            }
        }

        // Validate state machine
        if (!isValidStatusTransition(event.getStatus(), newStatus)) {
            throw new BadRequestException("Invalid status transition from " + event.getStatus() + " to " + newStatus);
        }

        // Only ADMIN can approve
        if (newStatus == Event.EventStatus.APPROVED && currentUser.getRole() != User.Role.ADMIN) {
            throw new BadRequestException("Only ADMIN can approve events");
        }

        event.setStatus(newStatus);
        Event updatedEvent = eventRepository.save(event);
        
        notifyDepartmentMembers(event.getDepartment(), updatedEvent, Notification.NotificationType.EVENT_UPDATED, "Event Status Updated to " + newStatus.name() + ". Note: " + (note != null ? note : ""));

        auditLogService.log("UPDATE_EVENT_STATUS", "Event", updatedEvent.getId(), "Updated status to " + newStatus + " for event: " + updatedEvent.getTitle());
        return mapToResponse(updatedEvent);
    }

    private boolean isValidStatusTransition(Event.EventStatus current, Event.EventStatus target) {
        if (current == target) return false;

        if (target == Event.EventStatus.CANCELLED) {
            return current == Event.EventStatus.DRAFT || current == Event.EventStatus.PLANNING || current == Event.EventStatus.APPROVED;
        }

        switch (current) {
            case DRAFT: return target == Event.EventStatus.PLANNING || target == Event.EventStatus.APPROVED;
            case PLANNING: return target == Event.EventStatus.APPROVED || target == Event.EventStatus.DRAFT;
            case APPROVED: return target == Event.EventStatus.ONGOING || target == Event.EventStatus.PLANNING;
            case ONGOING: return target == Event.EventStatus.COMPLETED;
            default: return false;
        }
    }
    
    private void notifyDepartmentMembers(Department department, Event event, Notification.NotificationType type, String message) {
        List<User> members = userRepository.findByDepartmentId(department.getId());
        for (User member : members) {
            Notification notification = Notification.builder()
                    .user(member)
                    .type(type)
                    .title(event.getTitle())
                    .message(message)
                    .referenceId(event.getId())
                    .referenceType("EVENT")
                    .build();
            notificationService.sendToUser(member.getId(), notification);
        }
    }

    private EventResponse mapToResponse(Event event) {
        return EventResponse.builder()
                .id(event.getId())
                .title(event.getTitle())
                .description(event.getDescription())
                .location(event.getLocation())
                .startTime(event.getStartTime())
                .endTime(event.getEndTime())
                .status(event.getStatus().name())
                .departmentId(event.getDepartment().getId())
                .departmentName(event.getDepartment().getName())
                .createdById(event.getCreatedBy().getId())
                .createdByName(event.getCreatedBy().getFullName())
                .createdAt(event.getCreatedAt())
                .updatedAt(event.getUpdatedAt())
                .isPublic(event.getIsPublic() != null ? event.getIsPublic() : false)
                .build();
    }
}
