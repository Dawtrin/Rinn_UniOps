package com.clubmanagement.club_management.repository;

import com.clubmanagement.club_management.entity.LeaveRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {
    List<LeaveRequest> findByUserId(Long userId);
    List<LeaveRequest> findBySessionId(Long sessionId);
}
