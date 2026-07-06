package com.clubmanagement.club_management.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreatePaymentRequest {
    @NotNull(message = "Amount is required")
    @Min(value = 1000, message = "Minimum amount is 1,000 VND")
    private Long amount;

    @NotBlank(message = "Order info is required")
    private String orderInfo;

    // Optional: link to specific member or event
    private Long memberId;
    private Long eventId;
}
