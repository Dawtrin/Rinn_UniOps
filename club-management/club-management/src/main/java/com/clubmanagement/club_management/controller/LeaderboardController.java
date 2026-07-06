package com.clubmanagement.club_management.controller;

import com.clubmanagement.club_management.dto.response.ApiResponse;
import com.clubmanagement.club_management.dto.response.UserResponse;
import com.clubmanagement.club_management.entity.User;
import com.clubmanagement.club_management.service.GamificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/leaderboard")
@RequiredArgsConstructor
public class LeaderboardController {

    private final GamificationService gamificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserResponse>>> getLeaderboard() {
        List<UserResponse> leaderboard = gamificationService.getLeaderboard().stream()
                .map(user -> UserResponse.builder()
                        .id(user.getId())
                        .fullName(user.getFullName())
                        .email(user.getEmail())
                        .avatarUrl(user.getAvatarUrl())
                        .xp(user.getXp())
                        .level(user.getLevel())
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Leaderboard retrieved successfully", leaderboard));
    }
}
