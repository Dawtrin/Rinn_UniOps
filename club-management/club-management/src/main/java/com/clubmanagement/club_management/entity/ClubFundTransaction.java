package com.clubmanagement.club_management.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "club_fund_transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClubFundTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType type; // INCOME, EXPENSE

    @Column(nullable = false)
    private Long amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionCategory category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recorded_by")
    private User recordedBy;

    @Column(name = "receipt_url", length = 500)
    private String receiptUrl;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum TransactionType {
        INCOME, EXPENSE
    }

    public enum TransactionCategory {
        MEMBERSHIP_FEE, SPONSOR, UNIFORM, PROPS, DRINKS, RENTAL, EVENT_COST, OTHER
    }
}
