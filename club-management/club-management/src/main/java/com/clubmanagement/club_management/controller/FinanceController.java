package com.clubmanagement.club_management.controller;

import com.clubmanagement.club_management.dto.response.ApiResponse;
import com.clubmanagement.club_management.entity.BudgetRequest;
import com.clubmanagement.club_management.entity.ClubFundTransaction;
import com.clubmanagement.club_management.service.FinanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/finance")
@RequiredArgsConstructor
public class FinanceController {

    private final FinanceService financeService;

    @GetMapping("/transactions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<ClubFundTransaction>>> getAllTransactions() {
        return ResponseEntity.ok(ApiResponse.success("Tải danh sách thu chi thành công", financeService.getAllTransactions()));
    }

    @PostMapping("/transactions")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<ClubFundTransaction>> createTransaction(
            @RequestBody Map<String, Object> body,
            Authentication authentication) {
        
        String title = (String) body.get("title");
        String type = (String) body.get("type");
        Long amount = ((Number) body.get("amount")).longValue();
        String category = (String) body.get("category");
        String receiptUrl = (String) body.get("receiptUrl");

        ClubFundTransaction transaction = financeService.createTransaction(
                title, type, amount, category, authentication.getName(), receiptUrl);
        return ResponseEntity.ok(ApiResponse.success("Ghi nhận giao dịch thành công", transaction));
    }

    @DeleteMapping("/transactions/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteTransaction(@PathVariable Long id) {
        financeService.deleteTransaction(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa giao dịch thành công"));
    }

    @GetMapping("/budget-requests")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'MEMBER')")
    public ResponseEntity<ApiResponse<List<BudgetRequest>>> getAllBudgetRequests() {
        return ResponseEntity.ok(ApiResponse.success("Tải các đề xuất kinh phí thành công", financeService.getAllBudgetRequests()));
    }

    @GetMapping("/budget-requests/event/{eventId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'MEMBER')")
    public ResponseEntity<ApiResponse<List<BudgetRequest>>> getBudgetRequestsByEvent(@PathVariable Long eventId) {
        return ResponseEntity.ok(ApiResponse.success("Tải đề xuất kinh phí của sự kiện thành công", financeService.getBudgetRequestsByEvent(eventId)));
    }

    @PostMapping("/budget-requests")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<BudgetRequest>> createBudgetRequest(
            @RequestBody Map<String, Object> body,
            Authentication authentication) {
        
        Long eventId = ((Number) body.get("eventId")).longValue();
        String title = (String) body.get("title");
        Long amount = ((Number) body.get("amount")).longValue();
        String description = (String) body.get("description");

        BudgetRequest request = financeService.createBudgetRequest(
                eventId, title, amount, description, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Gửi đề xuất kinh phí thành công", request));
    }

    @PutMapping("/budget-requests/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BudgetRequest>> approveBudgetRequest(
            @PathVariable Long id,
            Authentication authentication) {
        BudgetRequest request = financeService.approveBudgetRequest(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Đã phê duyệt đề xuất kinh phí sự kiện và giải ngân từ quỹ CLB", request));
    }

    @PutMapping("/budget-requests/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BudgetRequest>> rejectBudgetRequest(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication authentication) {
        String rejectReason = body.get("rejectReason");
        BudgetRequest request = financeService.rejectBudgetRequest(id, rejectReason, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Đã từ chối đề xuất chi tiêu", request));
    }
}
