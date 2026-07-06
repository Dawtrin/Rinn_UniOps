package com.clubmanagement.club_management.repository;

import com.clubmanagement.club_management.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByEventId(Long eventId);
    
    List<Task> findByAssignees_Id(Long userId);
    
    List<Task> findByAssignees_IdAndDeadlineBetween(Long userId, LocalDateTime start, LocalDateTime end);

    List<Task> findByEventDepartmentId(Long departmentId);
}

