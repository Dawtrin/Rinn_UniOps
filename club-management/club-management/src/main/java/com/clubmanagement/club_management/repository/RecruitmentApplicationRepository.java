package com.clubmanagement.club_management.repository;

import com.clubmanagement.club_management.entity.RecruitmentApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecruitmentApplicationRepository extends JpaRepository<RecruitmentApplication, Long> {
    List<RecruitmentApplication> findByStatus(RecruitmentApplication.ApplicationStatus status);
    List<RecruitmentApplication> findByDepartmentId(Long departmentId);
}
