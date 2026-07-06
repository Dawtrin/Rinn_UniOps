package com.clubmanagement.club_management.controller;

import com.clubmanagement.club_management.dto.response.ApiResponse;
import com.clubmanagement.club_management.entity.RecruitmentApplication;
import com.clubmanagement.club_management.entity.User;
import com.clubmanagement.club_management.service.RecruitmentApplicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class RecruitmentController {

    private final RecruitmentApplicationService recruitmentService;

    @PostMapping("/public/recruitment/apply")
    public ResponseEntity<ApiResponse<RecruitmentApplication>> apply(@RequestBody RecruitmentApplication request) {
        RecruitmentApplication app = recruitmentService.apply(request);
        return ResponseEntity.ok(ApiResponse.success("Hồ sơ của bạn đã được gửi thành công! CLB sẽ liên hệ phỏng vấn qua email.", app));
    }

    @GetMapping("/recruitment")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<RecruitmentApplication>>> getAllApplications(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Tải danh sách ứng viên thành công", recruitmentService.getAllApplications(authentication.getName())));
    }

    @GetMapping("/recruitment/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<RecruitmentApplication>> getApplicationById(
            @PathVariable Long id,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Tải chi tiết ứng viên thành công", recruitmentService.getApplicationById(id, authentication.getName())));
    }

    @PutMapping("/recruitment/{id}/evaluate")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<RecruitmentApplication>> evaluateApplication(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            Authentication authentication) {
        
        Integer score = body.get("score") != null ? ((Number) body.get("score")).intValue() : null;
        String comments = (String) body.get("comments");
        String status = (String) body.get("status");
        
        LocalDateTime interviewTime = null;
        if (body.get("interviewTime") != null) {
            interviewTime = LocalDateTime.parse((String) body.get("interviewTime"));
        }

        RecruitmentApplication updated = recruitmentService.evaluate(id, score, comments, status, interviewTime, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Cập nhật đánh giá ứng viên thành công", updated));
    }

    @PostMapping("/recruitment/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<User>> approveApplication(
            @PathVariable Long id,
            Authentication authentication) {
        User createdUser = recruitmentService.approveApplication(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt hồ sơ thành công! Đã tạo tài khoản và gửi email thông báo cho thành viên mới.", createdUser));
    }
}
