package com.clubmanagement.club_management.repository;

import com.clubmanagement.club_management.entity.SelfEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SelfEvaluationRepository extends JpaRepository<SelfEvaluation, Long> {
    List<SelfEvaluation> findByUserId(Long userId);
    
    Optional<SelfEvaluation> findByUserIdAndEvalMonth(Long userId, String evalMonth);
    
    List<SelfEvaluation> findByEvalMonth(String evalMonth);
    
    List<SelfEvaluation> findByStatus(SelfEvaluation.EvalStatus status);
}
