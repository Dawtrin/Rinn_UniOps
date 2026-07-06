package com.clubmanagement.club_management.service;

import com.clubmanagement.club_management.entity.BorrowRequest;
import com.clubmanagement.club_management.entity.InventoryItem;
import com.clubmanagement.club_management.entity.User;
import com.clubmanagement.club_management.repository.BorrowRequestRepository;
import com.clubmanagement.club_management.repository.InventoryItemRepository;
import com.clubmanagement.club_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryItemRepository inventoryItemRepository;
    private final BorrowRequestRepository borrowRequestRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    // --- Inventory Item CRUD ---

    public List<InventoryItem> getAllItems() {
        return inventoryItemRepository.findAll();
    }

    public InventoryItem getItemById(Long id) {
        return inventoryItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inventory item not found"));
    }

    @Transactional
    public InventoryItem createItem(InventoryItem item) {
        item.setAvailableQuantity(item.getQuantity());
        InventoryItem saved = inventoryItemRepository.save(item);
        auditLogService.log("CREATE_INVENTORY_ITEM", "InventoryItem", saved.getId(), "Tạo vật tư mới: " + item.getName());
        return saved;
    }

    @Transactional
    public InventoryItem updateItem(Long id, InventoryItem itemDetails) {
        InventoryItem item = getItemById(id);
        
        // Điều chỉnh availableQuantity theo hiệu số quantity mới
        int diff = itemDetails.getQuantity() - item.getQuantity();
        item.setQuantity(itemDetails.getQuantity());
        item.setAvailableQuantity(item.getAvailableQuantity() + diff);
        
        item.setName(itemDetails.getName());
        item.setDescription(itemDetails.getDescription());
        item.setLocation(itemDetails.getLocation());
        item.setItemCondition(itemDetails.getItemCondition());
        if (itemDetails.getImageUrl() != null) {
            item.setImageUrl(itemDetails.getImageUrl());
        }

        InventoryItem updated = inventoryItemRepository.save(item);
        auditLogService.log("UPDATE_INVENTORY_ITEM", "InventoryItem", id, "Cập nhật vật tư: " + item.getName());
        return updated;
    }

    @Transactional
    public void deleteItem(Long id) {
        InventoryItem item = getItemById(id);
        inventoryItemRepository.delete(item);
        auditLogService.log("DELETE_INVENTORY_ITEM", "InventoryItem", id, "Xóa vật tư: " + item.getName());
    }

    // --- Borrow Request logic ---

    public List<BorrowRequest> getAllBorrowRequests() {
        return borrowRequestRepository.findAll();
    }

    public List<BorrowRequest> getMyBorrowRequests(String username) {
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return borrowRequestRepository.findByUserId(user.getId());
    }

    @Transactional
    public BorrowRequest createBorrowRequest(Long itemId, Integer quantity, LocalDate borrowDate, LocalDate expectedReturnDate, String notes, String username) {
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        InventoryItem item = getItemById(itemId);

        if (quantity <= 0) {
            throw new RuntimeException("Số lượng mượn phải lớn hơn 0");
        }

        if (item.getAvailableQuantity() < quantity) {
            throw new RuntimeException("Số lượng thiết bị trong kho không đủ! Chỉ còn " + item.getAvailableQuantity() + " sản phẩm.");
        }

        BorrowRequest request = BorrowRequest.builder()
                .item(item)
                .user(user)
                .quantity(quantity)
                .borrowDate(borrowDate)
                .expectedReturnDate(expectedReturnDate)
                .notes(notes)
                .status(BorrowRequest.BorrowStatus.PENDING)
                .build();

        BorrowRequest saved = borrowRequestRepository.save(request);
        auditLogService.log("CREATE_BORROW_REQUEST", "BorrowRequest", saved.getId(), username, 
                "Gửi yêu cầu mượn " + quantity + " " + item.getName());
        return saved;
    }

    @Transactional
    public BorrowRequest handleBorrowRequest(Long id, String statusStr, String rejectReason, String username) {
        BorrowRequest request = borrowRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Borrow request not found"));
        
        BorrowRequest.BorrowStatus targetStatus = BorrowRequest.BorrowStatus.valueOf(statusStr);
        InventoryItem item = request.getItem();

        if (targetStatus == BorrowRequest.BorrowStatus.BORROWED || targetStatus == BorrowRequest.BorrowStatus.APPROVED) {
            if (request.getStatus() != BorrowRequest.BorrowStatus.PENDING) {
                throw new RuntimeException("Đơn mượn này đã được xử lý rồi!");
            }
            if (item.getAvailableQuantity() < request.getQuantity()) {
                throw new RuntimeException("Không đủ số lượng thiết bị trong kho để duyệt mượn!");
            }
            // Trừ số lượng sẵn có trong kho
            item.setAvailableQuantity(item.getAvailableQuantity() - request.getQuantity());
            inventoryItemRepository.save(item);
            request.setStatus(BorrowRequest.BorrowStatus.BORROWED);
        } 
        else if (targetStatus == BorrowRequest.BorrowStatus.REJECTED) {
            if (request.getStatus() != BorrowRequest.BorrowStatus.PENDING) {
                throw new RuntimeException("Chỉ có thể từ chối đơn mượn đang chờ duyệt PENDING");
            }
            request.setRejectReason(rejectReason);
            request.setStatus(BorrowRequest.BorrowStatus.REJECTED);
        } 
        else if (targetStatus == BorrowRequest.BorrowStatus.RETURNED) {
            if (request.getStatus() != BorrowRequest.BorrowStatus.BORROWED) {
                throw new RuntimeException("Chỉ có thể trả thiết bị khi trạng thái là đang mượn BORROWED");
            }
            // Cộng lại số lượng sẵn có vào kho
            item.setAvailableQuantity(item.getAvailableQuantity() + request.getQuantity());
            inventoryItemRepository.save(item);
            request.setActualReturnDate(LocalDate.now());
            request.setStatus(BorrowRequest.BorrowStatus.RETURNED);
        }

        BorrowRequest updated = borrowRequestRepository.save(request);
        auditLogService.log("HANDLE_BORROW_REQUEST", "BorrowRequest", id, username, 
                "Xử lý yêu cầu mượn đồ: Chuyển trạng thái sang " + updated.getStatus().name());
        return updated;
    }
}
