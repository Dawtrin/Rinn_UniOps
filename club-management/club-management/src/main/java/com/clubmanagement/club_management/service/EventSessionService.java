package com.clubmanagement.club_management.service;

import com.clubmanagement.club_management.dto.request.CreateSessionRequest;
import com.clubmanagement.club_management.dto.response.SessionResponse;
import com.clubmanagement.club_management.entity.Event;
import com.clubmanagement.club_management.entity.EventSession;
import com.clubmanagement.club_management.exception.ResourceNotFoundException;
import com.clubmanagement.club_management.repository.EventRepository;
import com.clubmanagement.club_management.repository.EventSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EventSessionService {

    private final EventSessionRepository sessionRepository;
    private final EventRepository eventRepository;

    public List<SessionResponse> getSessionsByEventId(Long eventId) {
        return sessionRepository.findByEventId(eventId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public SessionResponse createSession(Long eventId, CreateSessionRequest request) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with ID: " + eventId));

        EventSession session = EventSession.builder()
                .event(event)
                .title(request.getTitle())
                .sessionDate(request.getSessionDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .location(request.getLocation())
                .type(request.getType())
                .notes(request.getNotes())
                .build();

        EventSession savedSession = sessionRepository.save(session);
        return mapToResponse(savedSession);
    }

    public void deleteSession(Long sessionId) {
        EventSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found with ID: " + sessionId));
        sessionRepository.delete(session);
    }

    private SessionResponse mapToResponse(EventSession session) {
        return SessionResponse.builder()
                .id(session.getId())
                .eventId(session.getEvent().getId())
                .eventTitle(session.getEvent().getTitle())
                .title(session.getTitle())
                .sessionDate(session.getSessionDate())
                .startTime(session.getStartTime())
                .endTime(session.getEndTime())
                .location(session.getLocation())
                .type(session.getType().name())
                .notes(session.getNotes())
                .createdAt(session.getCreatedAt())
                .build();
    }
}
