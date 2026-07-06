package com.clubmanagement.club_management.repository;

import com.clubmanagement.club_management.entity.ClubFundTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClubFundTransactionRepository extends JpaRepository<ClubFundTransaction, Long> {
    List<ClubFundTransaction> findByType(ClubFundTransaction.TransactionType type);
    List<ClubFundTransaction> findAllByOrderByCreatedAtDesc();
}
