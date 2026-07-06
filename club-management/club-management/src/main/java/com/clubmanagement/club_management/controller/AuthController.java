package com.clubmanagement.club_management.controller;

import com.clubmanagement.club_management.dto.request.LoginRequest;
import com.clubmanagement.club_management.dto.request.RegisterRequest;
import com.clubmanagement.club_management.dto.request.TokenRefreshRequest;
import com.clubmanagement.club_management.dto.request.ForgotPasswordRequest;
import com.clubmanagement.club_management.dto.request.ResetPasswordRequest;
import com.clubmanagement.club_management.dto.response.ApiResponse;
import com.clubmanagement.club_management.dto.response.AuthResponse;
import com.clubmanagement.club_management.dto.response.TokenRefreshResponse;
import com.clubmanagement.club_management.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.success("Registration successful", response));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<TokenRefreshResponse>> refreshToken(@Valid @RequestBody TokenRefreshRequest request) {
        TokenRefreshResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.success("Token refreshed successfully", response));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Yêu cầu khôi phục mật khẩu thành công. Vui lòng kiểm tra email của bạn."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.getToken(), request.getPassword());
        return ResponseEntity.ok(ApiResponse.success("Đặt lại mật khẩu thành công."));
    }
}
