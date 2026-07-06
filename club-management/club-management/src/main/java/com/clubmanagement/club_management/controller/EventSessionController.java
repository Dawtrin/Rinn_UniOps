package com.clubmanagement.club_management.controller;

import com.clubmanagement.club_management.dto.request.CreateSessionRequest;
import com.clubmanagement.club_management.dto.response.ApiResponse;
import com.clubmanagement.club_management.dto.response.SessionResponse;
import com.clubmanagement.club_management.service.EventSessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class EventSessionController {

    private final EventSessionService sessionService;

    @GetMapping("/events/{eventId}/sessions")
    public ResponseEntity<ApiResponse<List<SessionResponse>>> getSessionsByEventId(@PathVariable Long eventId) {
        return ResponseEntity.ok(ApiResponse.success("Sessions retrieved successfully", sessionService.getSessionsByEventId(eventId)));
    }

    @PostMapping("/events/{eventId}/sessions")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<SessionResponse>> createSession(
            @PathVariable Long eventId, 
            @Valid @RequestBody CreateSessionRequest request) {
        // Ensuring the eventId matches the request, or we can just use the path variable
        request.setEventId(eventId);
        SessionResponse response = sessionService.createSession(eventId, request);
        return ResponseEntity.ok(ApiResponse.success("Session created successfully", response));
    }

    @DeleteMapping("/sessions/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteSession(@PathVariable Long id) {
        sessionService.deleteSession(id);
        return ResponseEntity.ok(ApiResponse.success("Session deleted successfully"));
    }
}
