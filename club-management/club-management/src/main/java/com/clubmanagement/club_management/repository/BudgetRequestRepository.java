package com.clubmanagement.club_management.repository;

import com.clubmanagement.club_management.entity.BudgetRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BudgetRequestRepository extends JpaRepository<BudgetRequest, Long> {
    List<BudgetRequest> findByEventId(Long eventId);
    List<BudgetRequest> findByStatus(BudgetRequest.BudgetStatus status);
}
