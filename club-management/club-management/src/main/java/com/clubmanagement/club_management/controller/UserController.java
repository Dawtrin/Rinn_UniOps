package com.clubmanagement.club_management.controller;

import com.clubmanagement.club_management.dto.request.UpdateUserRequest;
import com.clubmanagement.club_management.dto.request.UpdateProfileRequest;
import com.clubmanagement.club_management.dto.request.ChangePasswordRequest;
import com.clubmanagement.club_management.dto.response.ApiResponse;
import com.clubmanagement.club_management.entity.User;
import com.clubmanagement.club_management.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'MEMBER')")
    public ResponseEntity<ApiResponse<List<User>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.success("Users retrieved successfully", userService.getAllUsers()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<User>> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("User retrieved successfully", userService.getUserById(id)));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<User>> getMe(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Current user retrieved successfully", userService.getUserByEmail(authentication.getName())));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<User>> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest body) {
        User updated = userService.updateUser(id, body.getFullName(), body.getPhone(), body.getRole(), body.getDepartmentId(), body.getIsActive(), body.getEmail(), body.getPassword());
        return ResponseEntity.ok(ApiResponse.success("User updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success("User locked/deleted successfully"));
    }

    /** #38 — Cập nhật thông tin cá nhân (tự cập nhật) */
    @PutMapping("/me/profile")
    public ResponseEntity<ApiResponse<User>> updateMyProfile(
            @Valid @RequestBody UpdateProfileRequest body,
            Authentication authentication) {
        User updated = userService.updateMyProfile(authentication.getName(), body.getFullName(), body.getPhone());
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", updated));
    }

    /** #38 — Đổi mật khẩu */
    @PutMapping("/me/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest body,
            Authentication authentication) {
        userService.changePassword(authentication.getName(), body.getOldPassword(), body.getNewPassword());
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully"));
    }
}
