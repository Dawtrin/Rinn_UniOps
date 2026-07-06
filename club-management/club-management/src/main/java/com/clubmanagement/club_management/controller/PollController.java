package com.clubmanagement.club_management.controller;

import com.clubmanagement.club_management.dto.response.ApiResponse;
import com.clubmanagement.club_management.dto.response.PollResultResponse;
import com.clubmanagement.club_management.entity.Poll;
import com.clubmanagement.club_management.service.PollService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/polls")
@RequiredArgsConstructor
public class PollController {

    private final PollService pollService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'MEMBER')")
    public ResponseEntity<ApiResponse<List<Poll>>> getAllPolls(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Tải danh sách biểu quyết thành công", pollService.getAllPolls(authentication.getName())));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Poll>> createPoll(
            @RequestBody Map<String, Object> body,
            Authentication authentication) {
        
        String title = (String) body.get("title");
        String description = (String) body.get("description");
        List<String> options = (List<String>) body.get("options");
        Boolean allowMultiple = (Boolean) body.get("allowMultiple");
        
        LocalDateTime expiresAt = null;
        if (body.get("expiresAt") != null) {
            expiresAt = LocalDateTime.parse((String) body.get("expiresAt"));
        }

        Long departmentId = null;
        if (body.get("departmentId") != null) {
            departmentId = ((Number) body.get("departmentId")).longValue();
        }

        Poll poll = pollService.createPoll(title, description, options, allowMultiple, expiresAt, authentication.getName(), departmentId);
        return ResponseEntity.ok(ApiResponse.success("Tạo cuộc biểu quyết thành công", poll));
    }

    @PostMapping("/{id}/vote")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'MEMBER')")
    public ResponseEntity<ApiResponse<Void>> vote(
            @PathVariable Long id,
            @RequestBody Map<String, List<Long>> body,
            Authentication authentication) {
        
        List<Long> optionIds = body.get("optionIds");
        pollService.vote(id, optionIds, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Bình chọn của bạn đã được ghi nhận thành công"));
    }

    @PostMapping("/{id}/close")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Poll>> closePoll(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Đã kết thúc biểu quyết", pollService.closePoll(id, authentication.getName())));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deletePoll(@PathVariable Long id, Authentication authentication) {
        pollService.deletePoll(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Xóa cuộc biểu quyết thành công"));
    }

    @GetMapping("/{id}/results")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'MEMBER')")
    public ResponseEntity<ApiResponse<List<PollResultResponse>>> getPollResults(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Tải kết quả biểu quyết thành công", pollService.getPollResults(id)));
    }

    @GetMapping("/{id}/my-votes")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'MEMBER')")
    public ResponseEntity<ApiResponse<List<Long>>> getMyVotes(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Tải bình chọn của bạn thành công", pollService.getMyVotes(id, authentication.getName())));
    }

    @DeleteMapping("/{id}/vote")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'MEMBER')")
    public ResponseEntity<ApiResponse<Void>> retractVote(@PathVariable Long id, Authentication authentication) {
        pollService.retractVote(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Đã hủy bỏ bình chọn của bạn thành công"));
    }
}
