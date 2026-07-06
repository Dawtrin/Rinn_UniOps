package com.clubmanagement.club_management.controller;

import com.clubmanagement.club_management.dto.request.CheckInRequest;
import com.clubmanagement.club_management.dto.response.ApiResponse;
import com.clubmanagement.club_management.dto.response.AttendanceResponse;
import com.clubmanagement.club_management.service.AttendanceService;
import com.clubmanagement.club_management.service.QrAttendanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;
    private final QrAttendanceService qrAttendanceService;

    @GetMapping("/session/{sessionId}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> getAttendanceBySessionId(
            @PathVariable Long sessionId,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Attendance retrieved successfully", attendanceService.getAttendanceBySessionId(sessionId, authentication.getName())));
    }

    @PostMapping("/check-in")
    public ResponseEntity<ApiResponse<AttendanceResponse>> checkIn(
            @Valid @RequestBody CheckInRequest request,
            Authentication authentication) {
        AttendanceResponse response = attendanceService.checkIn(request, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Checked in successfully", response));
    }

    @PostMapping("/check-out/{sessionId}")
    public ResponseEntity<ApiResponse<AttendanceResponse>> checkOut(
            @PathVariable Long sessionId,
            Authentication authentication) {
        AttendanceResponse response = attendanceService.checkOut(sessionId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Checked out successfully", response));
    }

    // ======= QR Code Attendance Endpoints =======

    @GetMapping("/generate-qr/{sessionId}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> generateQrCode(@PathVariable Long sessionId) {
        java.util.Map<String, Object> qrData = qrAttendanceService.generateQrToken(sessionId);
        return ResponseEntity.ok(ApiResponse.success("QR Code generated (valid for 30s)", qrData));
    }

    @PostMapping("/check-in-qr")
    public ResponseEntity<ApiResponse<AttendanceResponse>> checkInWithQr(
            @RequestParam String token,
            Authentication authentication) {
        Long sessionId = qrAttendanceService.validateQrToken(token);
        CheckInRequest request = new CheckInRequest();
        request.setSessionId(sessionId);
        AttendanceResponse response = attendanceService.checkIn(request, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Checked in via QR Code successfully", response));
    }

    @PutMapping("/session/{sessionId}/user/{userId}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<AttendanceResponse>> markAttendance(
            @PathVariable Long sessionId,
            @PathVariable Long userId,
            @RequestParam String status,
            @RequestParam(required = false) String note,
            Authentication authentication) {
        AttendanceResponse response = attendanceService.markAttendance(sessionId, userId, status, note, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Attendance marked successfully", response));
    }

    @PostMapping("/session/{sessionId}/auto-absent")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Integer>> autoMarkAbsent(
            @PathVariable Long sessionId,
            Authentication authentication) {
        int count = attendanceService.autoMarkAbsent(sessionId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Auto-marked " + count + " members as ABSENT", count));
    }
}
