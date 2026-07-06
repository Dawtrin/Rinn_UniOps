package com.clubmanagement.club_management.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "leave_requests")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private EventSession session;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Column(columnDefinition = "TEXT")
    private String rejectReason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private LeaveStatus status = LeaveStatus.PENDING;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum LeaveStatus {
        PENDING, APPROVED, REJECTED
    }
}
