package com.clubmanagement.club_management.controller;

import com.clubmanagement.club_management.dto.request.AiSuggestRequest;
import com.clubmanagement.club_management.dto.request.AiSummarizeRequest;
import com.clubmanagement.club_management.dto.request.AiChatRequest;
import com.clubmanagement.club_management.dto.response.ApiResponse;
import com.clubmanagement.club_management.entity.User;
import com.clubmanagement.club_management.repository.UserRepository;
import com.clubmanagement.club_management.service.AiAssistantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiAssistantService aiAssistantService;
    private final UserRepository userRepository;

    @PostMapping("/suggest-assignees")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<String>> suggestAssignees(@Valid @RequestBody AiSuggestRequest request) {
        String title = request.getTitle();
        String description = request.getDescription();
        
        List<String> memberNames = userRepository.findAll().stream()
                .filter(u -> u.getRole() == User.Role.MEMBER)
                .map(User::getFullName)
                .collect(Collectors.toList());

        String suggestion = aiAssistantService.suggestAssignees(title, description, memberNames);
        return ResponseEntity.ok(ApiResponse.success("AI suggestion retrieved", suggestion));
    }

    @PostMapping("/summarize-meeting")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<String>> summarizeMeeting(@Valid @RequestBody AiSummarizeRequest request) {
        String content = request.getContent();
        String summary = aiAssistantService.summarizeMeeting(content);
        return ResponseEntity.ok(ApiResponse.success("Meeting summarized", summary));
    }

    /** #37 — Chat với AI có lưu lịch sử hội thoại */
    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<String>> chat(
            @Valid @RequestBody AiChatRequest request,
            Authentication authentication) {
        String userId = authentication.getName();
        String message = request.getMessage();
        String response = aiAssistantService.chat(userId, message);
        return ResponseEntity.ok(ApiResponse.success("AI response", response));
    }

    /** #37 — Xóa lịch sử hội thoại */
    @DeleteMapping("/chat/history")
    public ResponseEntity<ApiResponse<Void>> clearChatHistory(Authentication authentication) {
        aiAssistantService.clearHistory(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Chat history cleared"));
    }
}
