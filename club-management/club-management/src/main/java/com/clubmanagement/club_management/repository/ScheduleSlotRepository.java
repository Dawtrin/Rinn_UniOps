package com.clubmanagement.club_management.repository;

import com.clubmanagement.club_management.entity.ScheduleSlot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ScheduleSlotRepository extends JpaRepository<ScheduleSlot, Long> {
    List<ScheduleSlot> findByScheduleId(Long scheduleId);
    List<ScheduleSlot> findByScheduleIdOrderByDayOfWeekAscStartTimeAsc(Long scheduleId);
    void deleteByScheduleId(Long scheduleId);
}
