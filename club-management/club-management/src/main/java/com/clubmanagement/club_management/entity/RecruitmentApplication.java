package com.clubmanagement.club_management.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "recruitment_applications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecruitmentApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(nullable = false, length = 150)
    private String email;

    @Column(length = 20)
    private String phone;

    @Column(name = "cv_url", length = 500)
    private String cvUrl;

    @Column(columnDefinition = "TEXT")
    private String introduction;

    @Column(name = "department_id")
    private Long departmentId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ApplicationStatus status = ApplicationStatus.SUBMITTED;

    private Integer score;

    @Column(columnDefinition = "TEXT")
    private String comments;

    @Column(name = "interview_time")
    private LocalDateTime interviewTime;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum ApplicationStatus {
        SUBMITTED, REVIEWED, INTERVIEW_SCHEDULED, ACCEPTED, REJECTED
    }
}
