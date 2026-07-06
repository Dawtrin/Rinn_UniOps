package com.clubmanagement.club_management.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class PaymentRecordResponse {
    private Long id;
    private Long userId;
    private String userName;
    private String orderId;
    private String orderInfo;
    private Long amount;
    private String status;
    private String vnpTransactionNo;
    private String bankCode;
    private LocalDateTime createdAt;
    private LocalDateTime paidAt;
}
