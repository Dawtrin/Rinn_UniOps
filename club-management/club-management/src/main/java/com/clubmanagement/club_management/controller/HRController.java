package com.clubmanagement.club_management.controller;

import com.clubmanagement.club_management.dto.request.AssignMemberRequest;
import com.clubmanagement.club_management.dto.response.ApiResponse;
import com.clubmanagement.club_management.entity.User;
import com.clubmanagement.club_management.service.TeamService;
import com.clubmanagement.club_management.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/hr")
@RequiredArgsConstructor
public class HRController {

    private final TeamService teamService;
    private final UserService userService;

    @GetMapping("/unassigned-members")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<com.clubmanagement.club_management.dto.response.UserResponse>>> getUnassigned() {
        List<com.clubmanagement.club_management.dto.response.UserResponse> res = teamService.getUnassignedMembers().stream()
                .map(user -> com.clubmanagement.club_management.dto.response.UserResponse.builder()
                        .id(user.getId())
                        .fullName(user.getFullName())
                        .email(user.getEmail())
                        .avatarUrl(user.getAvatarUrl())
                        .role(user.getRole() != null ? user.getRole().name() : null)
                        .level(user.getLevel())
                        .xp(user.getXp())
                        .build())
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Unassigned members", res));
    }

    @PutMapping("/assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Void>> assignMember(
            @Valid @RequestBody AssignMemberRequest body,
            Authentication authentication) {
        teamService.assignMember(body.getUserId(), body.getTeamId(), authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Member assigned to team"));
    }

    @PutMapping("/bulk-assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Void>> bulkAssign(
            @RequestBody List<@Valid AssignMemberRequest> assignments,
            Authentication authentication) {
        teamService.bulkAssign(assignments, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Bulk assignment completed"));
    }

    @GetMapping("/org-chart")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getOrgChart() {
        return ResponseEntity.ok(ApiResponse.success("Org chart retrieved", teamService.getOrgChart()));
    }
}
