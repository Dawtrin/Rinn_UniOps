package com.clubmanagement.club_management.controller;

import com.clubmanagement.club_management.dto.request.CreateEventRequest;
import com.clubmanagement.club_management.dto.request.UpdateEventStatusRequest;
import com.clubmanagement.club_management.dto.response.ApiResponse;
import com.clubmanagement.club_management.dto.response.EventResponse;
import com.clubmanagement.club_management.service.EventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<EventResponse>>> getAllEvents(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Events retrieved successfully", eventService.getAllEvents(authentication.getName())));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EventResponse>> getEventById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Event retrieved successfully", eventService.getEventById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<EventResponse>> createEvent(
            @Valid @RequestBody CreateEventRequest request, 
            Authentication authentication) {
        EventResponse response = eventService.createEvent(request, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Event created successfully", response));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<EventResponse>> updateEventStatus(
            @PathVariable Long id, 
            @Valid @RequestBody UpdateEventStatusRequest request,
            Authentication authentication) {
        EventResponse response = eventService.updateEventStatus(id, request.getStatus(), request.getNote(), authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Event status updated successfully", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<EventResponse>> updateEvent(
            @PathVariable Long id,
            @Valid @RequestBody CreateEventRequest request,
            Authentication authentication) {
        EventResponse response = eventService.updateEvent(id, request, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Event updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteEvent(
            @PathVariable Long id,
            Authentication authentication) {
        eventService.deleteEvent(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Event deleted successfully"));
    }
}
