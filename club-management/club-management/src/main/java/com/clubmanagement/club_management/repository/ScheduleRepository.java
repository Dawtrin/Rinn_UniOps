package com.clubmanagement.club_management.repository;

import com.clubmanagement.club_management.entity.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ScheduleRepository extends JpaRepository<Schedule, Long> {
    List<Schedule> findByScopeTypeAndScopeId(Schedule.ScopeType scopeType, Long scopeId);
    Optional<Schedule> findByScopeTypeAndScopeIdAndWeekStart(Schedule.ScopeType scopeType, Long scopeId, LocalDate weekStart);
    List<Schedule> findByWeekStartAndStatus(LocalDate weekStart, Schedule.ScheduleStatus status);
    List<Schedule> findByScopeTypeAndWeekStart(Schedule.ScopeType scopeType, LocalDate weekStart);
}
