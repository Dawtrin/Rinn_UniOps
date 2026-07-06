package com.clubmanagement.club_management.controller;

import com.clubmanagement.club_management.dto.request.CreateLeaveRequest;
import com.clubmanagement.club_management.dto.request.UpdateLeaveStatusRequest;
import com.clubmanagement.club_management.dto.response.ApiResponse;
import com.clubmanagement.club_management.dto.response.LeaveRequestResponse;
import com.clubmanagement.club_management.entity.LeaveRequest;
import com.clubmanagement.club_management.service.LeaveRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/leaves")
@RequiredArgsConstructor
public class LeaveRequestController {

    private final LeaveRequestService leaveRequestService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<LeaveRequestResponse>>> getAllLeaveRequests(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("All leave requests", leaveRequestService.getAllLeaveRequests(userDetails.getUsername())));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<LeaveRequestResponse>>> getMyLeaveRequests(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("My leave requests", leaveRequestService.getMyLeaveRequests(userDetails.getUsername())));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<LeaveRequestResponse>> createLeaveRequest(
            @Valid @RequestBody CreateLeaveRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Leave request submitted", leaveRequestService.createLeaveRequest(request, userDetails.getUsername())));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<LeaveRequestResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateLeaveStatusRequest body,
            @AuthenticationPrincipal UserDetails userDetails) {
        LeaveRequest.LeaveStatus newStatus = LeaveRequest.LeaveStatus.valueOf(body.getStatus());
        String rejectReason = body.getRejectReason();
        return ResponseEntity.ok(ApiResponse.success("Leave request status updated", 
                leaveRequestService.updateStatus(id, newStatus, rejectReason, userDetails.getUsername())));
    }
}
