package com.clubmanagement.club_management.repository;

import com.clubmanagement.club_management.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByDepartmentId(Long departmentId);
    
    List<Event> findByStatus(Event.EventStatus status);
    
    List<Event> findByStartTimeBetween(LocalDateTime start, LocalDateTime end);
    
    List<Event> findByIsPublicTrue();
}
