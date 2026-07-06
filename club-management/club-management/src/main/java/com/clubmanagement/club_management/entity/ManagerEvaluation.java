package com.clubmanagement.club_management.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "manager_evaluations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ManagerEvaluation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "self_evaluation_id", nullable = false, unique = true)
    private SelfEvaluation selfEvaluation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id", nullable = false)
    private User manager;

    @Column(name = "task_score", nullable = false)
    private Integer taskScore;

    @Column(name = "attendance_score", nullable = false)
    private Integer attendanceScore;

    @Column(name = "attitude_score", nullable = false)
    private Integer attitudeScore;

    @Column(name = "final_score", nullable = false)
    private Integer finalScore;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Grade grade;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(name = "evaluated_at", updatable = false)
    private LocalDateTime evaluatedAt;

    @PrePersist
    protected void onCreate() {
        evaluatedAt = LocalDateTime.now();
    }

    public enum Grade {
        EXCELLENT, GOOD, PASS, FAIL
    }
}
