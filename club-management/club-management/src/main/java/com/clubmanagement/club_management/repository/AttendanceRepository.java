package com.clubmanagement.club_management.repository;

import com.clubmanagement.club_management.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findBySessionId(Long sessionId);
    
    List<Attendance> findByUserId(Long userId);
    
    Optional<Attendance> findBySessionIdAndUserId(Long sessionId, Long userId);
}
