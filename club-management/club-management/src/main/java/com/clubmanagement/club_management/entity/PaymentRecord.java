package com.clubmanagement.club_management.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "payment_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "order_id", nullable = false, unique = true)
    private String orderId;

    @Column(name = "order_info")
    private String orderInfo;

    /** Số tiền (đơn vị: VNĐ) */
    @Column(nullable = false)
    private Long amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PaymentStatus status = PaymentStatus.PENDING;

    @Column(name = "vnp_transaction_no")
    private String vnpTransactionNo;

    @Column(name = "bank_code")
    private String bankCode;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum PaymentStatus {
        PENDING, SUCCESS, FAILED
    }
}
