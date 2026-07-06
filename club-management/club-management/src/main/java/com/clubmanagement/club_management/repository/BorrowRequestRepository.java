package com.clubmanagement.club_management.repository;

import com.clubmanagement.club_management.entity.BorrowRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BorrowRequestRepository extends JpaRepository<BorrowRequest, Long> {
    List<BorrowRequest> findByUserId(Long userId);
    List<BorrowRequest> findByStatus(BorrowRequest.BorrowStatus status);
}
