package com.clubmanagement.club_management.controller;

import com.clubmanagement.club_management.dto.response.ApiResponse;
import com.clubmanagement.club_management.entity.BorrowRequest;
import com.clubmanagement.club_management.entity.InventoryItem;
import com.clubmanagement.club_management.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'MEMBER')")
    public ResponseEntity<ApiResponse<List<InventoryItem>>> getAllItems() {
        return ResponseEntity.ok(ApiResponse.success("Tải danh sách kho đồ thành công", inventoryService.getAllItems()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<InventoryItem>> createItem(@RequestBody InventoryItem item) {
        return ResponseEntity.ok(ApiResponse.success("Tạo thiết bị/đạo cụ mới thành công", inventoryService.createItem(item)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<InventoryItem>> updateItem(@PathVariable Long id, @RequestBody InventoryItem item) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thiết bị/đạo cụ thành công", inventoryService.updateItem(id, item)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deleteItem(@PathVariable Long id) {
        inventoryService.deleteItem(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa thiết bị/đạo cụ thành công"));
    }

    @GetMapping("/borrow")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'MEMBER')")
    public ResponseEntity<ApiResponse<List<BorrowRequest>>> getBorrowRequests(Authentication authentication) {
        // Trả về toàn bộ yêu cầu nếu là Admin/Manager, hoặc chỉ của bản thân nếu là Member
        boolean isStaff = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_MANAGER"));
        
        List<BorrowRequest> list = isStaff ? inventoryService.getAllBorrowRequests() 
                                           : inventoryService.getMyBorrowRequests(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Tải lịch sử mượn trả thành công", list));
    }

    @PostMapping("/borrow")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'MEMBER')")
    public ResponseEntity<ApiResponse<BorrowRequest>> createBorrowRequest(
            @RequestBody Map<String, Object> body,
            Authentication authentication) {
        
        Long itemId = ((Number) body.get("itemId")).longValue();
        Integer quantity = ((Number) body.get("quantity")).intValue();
        LocalDate borrowDate = LocalDate.parse((String) body.get("borrowDate"));
        LocalDate expectedReturnDate = LocalDate.parse((String) body.get("expectedReturnDate"));
        String notes = (String) body.get("notes");

        BorrowRequest request = inventoryService.createBorrowRequest(
                itemId, quantity, borrowDate, expectedReturnDate, notes, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Gửi yêu cầu mượn thiết bị thành công", request));
    }

    @PutMapping("/borrow/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<BorrowRequest>> handleBorrowRequest(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication authentication) {
        
        String status = body.get("status");
        String rejectReason = body.get("rejectReason");
        BorrowRequest request = inventoryService.handleBorrowRequest(id, status, rejectReason, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái đơn mượn đồ thành công", request));
    }
}
