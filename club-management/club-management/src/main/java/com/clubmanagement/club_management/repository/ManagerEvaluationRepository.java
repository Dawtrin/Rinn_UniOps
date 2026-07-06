package com.clubmanagement.club_management.repository;

import com.clubmanagement.club_management.entity.ManagerEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ManagerEvaluationRepository extends JpaRepository<ManagerEvaluation, Long> {
    Optional<ManagerEvaluation> findBySelfEvaluationId(Long selfEvaluationId);
    
    List<ManagerEvaluation> findByManagerId(Long managerId);
}
