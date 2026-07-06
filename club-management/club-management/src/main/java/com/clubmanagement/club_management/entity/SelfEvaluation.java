package com.clubmanagement.club_management.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "self_evaluations", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "eval_month"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SelfEvaluation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "eval_month", nullable = false, length = 7)
    private String evalMonth;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(columnDefinition = "TEXT")
    private String achievements;

    @Column(columnDefinition = "TEXT")
    private String improvements;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private EvalStatus status = EvalStatus.DRAFT;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToOne(mappedBy = "selfEvaluation", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private ManagerEvaluation managerEvaluation;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum EvalStatus {
        DRAFT, SUBMITTED, REVIEWED
    }
}
