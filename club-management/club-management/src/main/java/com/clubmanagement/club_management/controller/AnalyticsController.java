package com.clubmanagement.club_management.controller;

import com.clubmanagement.club_management.dto.response.AnalyticsResponse;
import com.clubmanagement.club_management.dto.response.ApiResponse;
import com.clubmanagement.club_management.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<AnalyticsResponse>> getDashboard() {
        return ResponseEntity.ok(ApiResponse.success(
                "Dashboard statistics retrieved successfully",
                analyticsService.getDashboardStats()
        ));
    }
}
