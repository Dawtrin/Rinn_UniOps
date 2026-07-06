package com.clubmanagement.club_management.repository;

import com.clubmanagement.club_management.entity.PaymentRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRecordRepository extends JpaRepository<PaymentRecord, Long> {
    List<PaymentRecord> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<PaymentRecord> findByOrderId(String orderId);
}
