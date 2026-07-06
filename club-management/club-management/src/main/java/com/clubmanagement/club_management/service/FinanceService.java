package com.clubmanagement.club_management.service;

import com.clubmanagement.club_management.entity.BudgetRequest;
import com.clubmanagement.club_management.entity.ClubFundTransaction;
import com.clubmanagement.club_management.entity.Event;
import com.clubmanagement.club_management.entity.User;
import com.clubmanagement.club_management.repository.BudgetRequestRepository;
import com.clubmanagement.club_management.repository.ClubFundTransactionRepository;
import com.clubmanagement.club_management.repository.EventRepository;
import com.clubmanagement.club_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FinanceService {

    private final ClubFundTransactionRepository transactionRepository;
    private final BudgetRequestRepository budgetRequestRepository;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final AuditLogService auditLogService;

    // --- Fund Transactions ---

    public List<ClubFundTransaction> getAllTransactions() {
        return transactionRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public ClubFundTransaction createTransaction(String title, String typeStr, Long amount, String categoryStr, String username, String receiptUrl) {
        User user = userRepository.findByEmail(username).orElse(null);
        
        ClubFundTransaction transaction = ClubFundTransaction.builder()
                .title(title)
                .type(ClubFundTransaction.TransactionType.valueOf(typeStr))
                .amount(amount)
                .category(ClubFundTransaction.TransactionCategory.valueOf(categoryStr))
                .recordedBy(user)
                .receiptUrl(receiptUrl)
                .build();

        ClubFundTransaction saved = transactionRepository.save(transaction);
        auditLogService.log("CREATE_TRANSACTION", "ClubFundTransaction", saved.getId(), username, 
                "Ghi nhận giao dịch " + transaction.getType().name() + ": " + transaction.getTitle() + " - " + amount + "đ");
        return saved;
    }

    @Transactional
    public void deleteTransaction(Long id) {
        ClubFundTransaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
        transactionRepository.delete(transaction);
        auditLogService.log("DELETE_TRANSACTION", "ClubFundTransaction", id, "Xóa giao dịch: " + transaction.getTitle());
    }

    // --- Budget Requests ---

    public List<BudgetRequest> getAllBudgetRequests() {
        return budgetRequestRepository.findAll();
    }

    public List<BudgetRequest> getBudgetRequestsByEvent(Long eventId) {
        return budgetRequestRepository.findByEventId(eventId);
    }

    @Transactional
    public BudgetRequest createBudgetRequest(Long eventId, String title, Long amount, String description, String username) {
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        BudgetRequest request = BudgetRequest.builder()
                .event(event)
                .title(title)
                .amount(amount)
                .description(description)
                .status(BudgetRequest.BudgetStatus.PENDING)
                .requestedBy(user)
                .build();

        BudgetRequest saved = budgetRequestRepository.save(request);
        auditLogService.log("CREATE_BUDGET_REQUEST", "BudgetRequest", saved.getId(), username, 
                "Tạo đề xuất kinh phí sự kiện: " + title + " - " + amount + "đ");
        return saved;
    }

    @Transactional
    public BudgetRequest approveBudgetRequest(Long id, String username) {
        User admin = userRepository.findByEmail(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        BudgetRequest request = budgetRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Budget request not found"));

        if (request.getStatus() != BudgetRequest.BudgetStatus.PENDING) {
            throw new RuntimeException("Chỉ có thể phê duyệt đề xuất ở trạng thái PENDING");
        }

        request.setStatus(BudgetRequest.BudgetStatus.APPROVED);
        request.setApprovedBy(admin);
        BudgetRequest updated = budgetRequestRepository.save(request);

        // Tự động tạo giao dịch CHI (EXPENSE) tương ứng trong Sổ quỹ CLB
        ClubFundTransaction transaction = ClubFundTransaction.builder()
                .title("Tạm ứng chi sự kiện: " + request.getEvent().getTitle() + " (" + request.getTitle() + ")")
                .type(ClubFundTransaction.TransactionType.EXPENSE)
                .amount(request.getAmount())
                .category(ClubFundTransaction.TransactionCategory.EVENT_COST)
                .recordedBy(admin)
                .build();
        transactionRepository.save(transaction);

        auditLogService.log("APPROVE_BUDGET_REQUEST", "BudgetRequest", id, username, 
                "Phê duyệt đề xuất kinh phí: " + request.getTitle() + " - Tự động tạo giao dịch chi tương ứng");
        return updated;
    }

    @Transactional
    public BudgetRequest rejectBudgetRequest(Long id, String rejectReason, String username) {
        User admin = userRepository.findByEmail(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        BudgetRequest request = budgetRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Budget request not found"));

        if (request.getStatus() != BudgetRequest.BudgetStatus.PENDING) {
            throw new RuntimeException("Chỉ có thể từ chối đề xuất ở trạng thái PENDING");
        }

        request.setStatus(BudgetRequest.BudgetStatus.REJECTED);
        request.setApprovedBy(admin);
        request.setRejectReason(rejectReason);
        BudgetRequest updated = budgetRequestRepository.save(request);

        auditLogService.log("REJECT_BUDGET_REQUEST", "BudgetRequest", id, username, 
                "Từ chối đề xuất kinh phí: " + request.getTitle() + ". Lý do: " + rejectReason);
        return updated;
    }
}
