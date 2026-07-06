package com.clubmanagement.club_management.repository;

import com.clubmanagement.club_management.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TeamRepository extends JpaRepository<Team, Long> {
    List<Team> findByDepartmentId(Long departmentId);
    List<Team> findByDepartmentIdAndIsActiveTrue(Long departmentId);
    List<Team> findByIsActiveTrue();
}
