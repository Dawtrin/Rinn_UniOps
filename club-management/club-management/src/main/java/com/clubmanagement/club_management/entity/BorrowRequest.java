package com.clubmanagement.club_management.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "borrow_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BorrowRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "item_id", nullable = false)
    private InventoryItem item;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "borrow_date", nullable = false)
    private LocalDate borrowDate;

    @Column(name = "expected_return_date", nullable = false)
    private LocalDate expectedReturnDate;

    @Column(name = "actual_return_date")
    private LocalDate actualReturnDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private BorrowStatus status = BorrowStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "reject_reason", columnDefinition = "TEXT")
    private String rejectReason;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum BorrowStatus {
        PENDING, APPROVED, REJECTED, BORROWED, RETURNED
    }
}
