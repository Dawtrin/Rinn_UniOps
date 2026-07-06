package com.clubmanagement.club_management.repository;

import com.clubmanagement.club_management.entity.Event.EventStatus;
import com.clubmanagement.club_management.entity.EventSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface EventSessionRepository extends JpaRepository<EventSession, Long> {
    List<EventSession> findByEventId(Long eventId);
    
    List<EventSession> findByEventDepartmentIdAndEventStatusInAndSessionDateBetween(
            Long departmentId, List<EventStatus> statuses, LocalDate start, LocalDate end);
}

