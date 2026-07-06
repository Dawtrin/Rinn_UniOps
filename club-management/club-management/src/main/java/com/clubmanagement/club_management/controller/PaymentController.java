package com.clubmanagement.club_management.controller;

import com.clubmanagement.club_management.dto.request.CreatePaymentRequest;
import com.clubmanagement.club_management.dto.response.ApiResponse;
import com.clubmanagement.club_management.dto.response.PaymentRecordResponse;
import com.clubmanagement.club_management.entity.PaymentRecord;
import com.clubmanagement.club_management.entity.User;
import com.clubmanagement.club_management.repository.PaymentRecordRepository;
import com.clubmanagement.club_management.repository.UserRepository;
import com.clubmanagement.club_management.service.VNPayService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.clubmanagement.club_management.service.EmailService;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final VNPayService vnPayService;
    private final PaymentRecordRepository paymentRecordRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final com.clubmanagement.club_management.service.FinanceService financeService;
    
    @org.springframework.beans.factory.annotation.Value("${app.frontend.url:http://localhost:5173}")
    private String frontendBaseUrl;

    /**
     * Tạo yêu cầu thanh toán — trả về URL để Frontend redirect sang cổng VNPay.
     */
    @PostMapping("/create")
    public ResponseEntity<ApiResponse<Map<String, String>>> createPayment(
            @Valid @RequestBody CreatePaymentRequest request,
            HttpServletRequest httpRequest,
            Authentication authentication) {

        String orderId = "CLB-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String ipAddr = getClientIp(httpRequest);

        String paymentUrl = vnPayService.createPaymentUrl(
                request.getAmount(),
                orderId,
                request.getOrderInfo(),
                ipAddr
        );

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        PaymentRecord record = PaymentRecord.builder()
                .user(user)
                .orderId(orderId)
                .orderInfo(request.getOrderInfo())
                .amount(request.getAmount())
                .status(PaymentRecord.PaymentStatus.PENDING)
                .build();
        paymentRecordRepository.save(record);

        Map<String, String> data = new HashMap<>();
        data.put("orderId", orderId);
        data.put("paymentUrl", paymentUrl);

        return ResponseEntity.ok(ApiResponse.success("Payment URL created successfully. Redirect user to paymentUrl.", data));
    }

    /**
     * VNPay IPN / confirm endpoint — Frontend gọi endpoint này sau khi VNPay redirect về
     * với toàn bộ query params. Backend validate chữ ký và cập nhật trạng thái giao dịch.
     * Không cần JWT vì người dùng vừa mới thanh toán, JWT có thể đã hết hạn tab.
     */
    @PostMapping("/confirm")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<ApiResponse<Map<String, String>>> confirmPayment(
            @RequestBody Map<String, String> params) {

        boolean isValid = vnPayService.validateCallback(new HashMap<>(params));
        String responseCode = params.get("vnp_ResponseCode");
        String orderId = params.get("vnp_TxnRef");
        String amount = params.get("vnp_Amount");
        String vnpTransactionNo = params.get("vnp_TransactionNo");
        String bankCode = params.get("vnp_BankCode");

        System.out.println("=== VNPAY CONFIRM CALLED ===");
        System.out.println("orderId: " + orderId + ", responseCode: " + responseCode + ", isValid: " + isValid);

        // Find the payment record and update its status
        java.util.Optional<PaymentRecord> optRecord = paymentRecordRepository.findByOrderId(orderId);
        if (optRecord.isPresent()) {
            PaymentRecord record = optRecord.get();
            // Only update if still pending (prevent duplicate processing)
            if (record.getStatus() == PaymentRecord.PaymentStatus.PENDING) {
                record.setVnpTransactionNo(vnpTransactionNo);
                record.setBankCode(bankCode);
                if (isValid && "00".equals(responseCode)) {
                    record.setStatus(PaymentRecord.PaymentStatus.SUCCESS);
                    record.setPaidAt(LocalDateTime.now());
                    try {
                        financeService.createTransaction(
                            "Thu hội phí/quỹ: " + record.getOrderInfo() + " (" + record.getUser().getFullName() + ")",
                            "INCOME",
                            record.getAmount(),
                            "MEMBERSHIP_FEE",
                            record.getUser().getEmail(),
                            null
                        );
                    } catch (Exception ex) {
                        System.err.println("Finance transaction error: " + ex.getMessage());
                    }
                    // Send Email Confirmation
                    try {
                        String emailContent = "<h3>Xác nhận thanh toán hội phí thành công</h3>" +
                                "<p>Chào bạn <strong>" + record.getUser().getFullName() + "</strong>,</p>" +
                                "<p>Giao dịch đóng hội phí của bạn qua cổng VNPay đã được thực hiện thành công:</p>" +
                                "<ul>" +
                                "<li><strong>Mã đơn hàng:</strong> " + record.getOrderId() + "</li>" +
                                "<li><strong>Nội dung:</strong> " + record.getOrderInfo() + "</li>" +
                                "<li><strong>Số tiền:</strong> " + String.format("%,d", record.getAmount()) + " VNĐ</li>" +
                                "<li><strong>Mã giao dịch VNPay:</strong> " + vnpTransactionNo + "</li>" +
                                "<li><strong>Ngân hàng:</strong> " + bankCode + "</li>" +
                                "<li><strong>Thời gian thanh toán:</strong> " + record.getPaidAt() + "</li>" +
                                "</ul>" +
                                "<p>Cảm ơn bạn đã đóng góp hội phí xây dựng câu lạc bộ.</p>" +
                                "<hr style='border: none; border-top: 0.5px solid #eaeaea; margin: 20px 0;'/>" +
                                "<p style='font-size: 0.8rem; color: #888;'>Hệ thống quản trị câu lạc bộ Rin UniOps</p>";
                        emailService.sendHtmlEmail(record.getUser().getEmail(),
                                "[Club OS] Biên lai thanh toán hội phí thành công", emailContent);
                    } catch (Exception ex) {
                        System.err.println("Email send error: " + ex.getMessage());
                    }
                } else {
                    record.setStatus(PaymentRecord.PaymentStatus.FAILED);
                }
                paymentRecordRepository.save(record);
            }
        }

        Map<String, String> result = new HashMap<>();
        result.put("status", (isValid && "00".equals(responseCode)) ? "success" : "failed");
        result.put("orderId", orderId);
        result.put("amount", amount);
        result.put("responseCode", responseCode);
        return ResponseEntity.ok(ApiResponse.success("Payment confirmation processed", result));
    }

    /**
     * VNPay callback endpoint (legacy) — kept for backward compatibility.
     * Now VNPay redirects directly to frontend; this endpoint may no longer be called.
     */
    @GetMapping("/callback")
    @org.springframework.transaction.annotation.Transactional
    public void paymentCallback(
            @RequestParam Map<String, String> params,
            HttpServletResponse response) throws IOException {

        // Delegate to same logic — just redirect to frontend
        boolean isValid = vnPayService.validateCallback(new HashMap<>(params));
        String responseCode = params.get("vnp_ResponseCode");
        String orderId = params.get("vnp_TxnRef");
        String amount = params.get("vnp_Amount");

        String frontendUrl;
        if (isValid && "00".equals(responseCode)) {
            frontendUrl = String.format("%s/payments?status=success&orderId=%s&amount=%s",
                    frontendBaseUrl, orderId, amount);
        } else {
            frontendUrl = String.format("%s/payments?status=failed&code=%s",
                    frontendBaseUrl, responseCode);
        }
        response.sendRedirect(frontendUrl);
    }

    /**
     * DEMO MODE: Xác nhận chuyển khoản thủ công (không qua VNPay).
     * Frontend hiện QR MB Bank → user quét chuyển khoản → nhấn "Xác nhận" → endpoint này ghi nhận.
     */
    @PostMapping("/demo-confirm")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<ApiResponse<Map<String, String>>> demoConfirmPayment(
            @RequestBody Map<String, Object> body,
            Authentication authentication) {

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        long amount = Long.parseLong(body.getOrDefault("amount", "0").toString());
        String orderInfo = body.getOrDefault("orderInfo", "Demo chuyển khoản MB Bank").toString();

        if (amount < 1000) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Số tiền không hợp lệ"));
        }

        String orderId = "DEMO-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String demoTxnNo = "DEMO" + System.currentTimeMillis();

        PaymentRecord record = PaymentRecord.builder()
                .user(user)
                .orderId(orderId)
                .orderInfo(orderInfo)
                .amount(amount)
                .status(PaymentRecord.PaymentStatus.SUCCESS)
                .vnpTransactionNo(demoTxnNo)
                .bankCode("MB_BANK")
                .paidAt(LocalDateTime.now())
                .build();
        paymentRecordRepository.save(record);

        // Tạo giao dịch thu trong quỹ
        try {
            financeService.createTransaction(
                "Thu hội phí/quỹ (DEMO): " + orderInfo + " (" + user.getFullName() + ")",
                "INCOME",
                amount,
                "MEMBERSHIP_FEE",
                user.getEmail(),
                null
            );
        } catch (Exception ex) {
            System.err.println("Demo finance transaction error: " + ex.getMessage());
        }

        Map<String, String> result = new HashMap<>();
        result.put("status", "success");
        result.put("orderId", orderId);
        result.put("amount", String.valueOf(amount));
        result.put("transactionNo", demoTxnNo);

        return ResponseEntity.ok(ApiResponse.success("Demo payment confirmed successfully", result));
    }

    /**
     * Lấy lịch sử thanh toán của người dùng hiện tại.
     */
    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<PaymentRecordResponse>>> getPaymentHistory(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<PaymentRecordResponse> history = paymentRecordRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(record -> PaymentRecordResponse.builder()
                        .id(record.getId())
                        .userId(record.getUser().getId())
                        .userName(record.getUser().getFullName())
                        .orderId(record.getOrderId())
                        .orderInfo(record.getOrderInfo())
                        .amount(record.getAmount())
                        .status(record.getStatus().name())
                        .vnpTransactionNo(record.getVnpTransactionNo())
                        .bankCode(record.getBankCode())
                        .createdAt(record.getCreatedAt())
                        .paidAt(record.getPaidAt())
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success("Payment history retrieved successfully", history));
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
