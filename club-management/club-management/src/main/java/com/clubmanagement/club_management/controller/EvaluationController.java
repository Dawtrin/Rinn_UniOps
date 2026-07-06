package com.clubmanagement.club_management.controller;

import com.clubmanagement.club_management.dto.request.ManagerEvaluationRequest;
import com.clubmanagement.club_management.dto.request.SelfEvaluationRequest;
import com.clubmanagement.club_management.dto.response.ApiResponse;
import com.clubmanagement.club_management.dto.response.EvaluationResponse;
import com.clubmanagement.club_management.service.EvaluationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/evaluations")
@RequiredArgsConstructor
public class EvaluationController {

    private final EvaluationService evaluationService;

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN') or @userSecurity.isCurrentUser(authentication, #userId)")
    public ResponseEntity<ApiResponse<List<EvaluationResponse>>> getEvaluationsByUserId(
            @PathVariable Long userId,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Evaluations retrieved successfully", evaluationService.getEvaluationsByUserId(userId, authentication.getName())));
    }

    @PostMapping("/self")
    public ResponseEntity<ApiResponse<EvaluationResponse>> submitSelfEvaluation(
            @Valid @RequestBody SelfEvaluationRequest request,
            Authentication authentication) {
        EvaluationResponse response = evaluationService.submitSelfEvaluation(request, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Self evaluation submitted successfully", response));
    }

    /** #35 — Lưu nháp tự đánh giá (DRAFT), chưa nộp */
    @PostMapping("/draft")
    public ResponseEntity<ApiResponse<EvaluationResponse>> saveDraftEvaluation(
            @Valid @RequestBody SelfEvaluationRequest request,
            Authentication authentication) {
        EvaluationResponse response = evaluationService.saveDraftEvaluation(request, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Draft saved successfully", response));
    }

    /** #35 — Nộp bản nháp đã lưu */
    @PutMapping("/{id}/submit")
    public ResponseEntity<ApiResponse<EvaluationResponse>> submitDraft(
            @PathVariable Long id,
            Authentication authentication) {
        EvaluationResponse response = evaluationService.submitDraft(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Draft submitted successfully", response));
    }

    @PostMapping("/{id}/evaluate")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<EvaluationResponse>> evaluateMember(
            @PathVariable Long id,
            @Valid @RequestBody ManagerEvaluationRequest request,
            Authentication authentication) {
        EvaluationResponse response = evaluationService.evaluateMember(id, request, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Evaluation completed successfully", response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<List<EvaluationResponse>>> getMyEvaluations(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Success", evaluationService.getEvaluationsByUserEmail(authentication.getName())));
    }

    @GetMapping("/manager")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<EvaluationResponse>>> getEvaluationsForManager(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Success", evaluationService.getPendingEvaluationsForManager(authentication.getName())));
    }
}
