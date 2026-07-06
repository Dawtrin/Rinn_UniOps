package com.clubmanagement.club_management.service;

import com.clubmanagement.club_management.dto.request.CreateLeaveRequest;
import com.clubmanagement.club_management.dto.response.LeaveRequestResponse;
import com.clubmanagement.club_management.entity.Attendance;
import com.clubmanagement.club_management.entity.EventSession;
import com.clubmanagement.club_management.entity.LeaveRequest;
import com.clubmanagement.club_management.entity.User;
import com.clubmanagement.club_management.exception.ResourceNotFoundException;
import com.clubmanagement.club_management.repository.AttendanceRepository;
import com.clubmanagement.club_management.repository.EventSessionRepository;
import com.clubmanagement.club_management.repository.LeaveRequestRepository;
import com.clubmanagement.club_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LeaveRequestService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final UserRepository userRepository;
    private final EventSessionRepository sessionRepository;
    private final AttendanceRepository attendanceRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<LeaveRequestResponse> getAllLeaveRequests(String email) {
        User caller = userRepository.findByEmail(email).orElseThrow();
        if (caller.getRole() == User.Role.ADMIN) {
            return leaveRequestRepository.findAll().stream()
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());
        }
        
        Long departmentId = caller.getDepartment() != null ? caller.getDepartment().getId() : null;
        if (departmentId == null) {
            return java.util.Collections.emptyList();
        }
        return leaveRequestRepository.findAll().stream()
                .filter(lr -> lr.getUser().getDepartment() != null && lr.getUser().getDepartment().getId().equals(departmentId))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LeaveRequestResponse> getMyLeaveRequests(String email) {
        User user = userRepository.findByEmail(email).orElseThrow();
        return leaveRequestRepository.findByUserId(user.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public LeaveRequestResponse createLeaveRequest(CreateLeaveRequest request, String email) {
        User user = userRepository.findByEmail(email).orElseThrow();
        EventSession session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        LeaveRequest leaveRequest = LeaveRequest.builder()
                .user(user)
                .session(session)
                .reason(request.getReason())
                .status(LeaveRequest.LeaveStatus.PENDING)
                .build();

        LeaveRequest saved = leaveRequestRepository.save(leaveRequest);
        auditLogService.log("CREATE_LEAVE_REQUEST", "LeaveRequest", saved.getId(), "User submitted a leave request for session: " + session.getTitle());
        return mapToResponse(saved);
    }

    @Transactional
    public LeaveRequestResponse updateStatus(Long id, LeaveRequest.LeaveStatus newStatus, String rejectReason, String managerEmail) {
        LeaveRequest leaveRequest = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Leave request not found"));

        User manager = userRepository.findByEmail(managerEmail).orElseThrow();
        if (manager.getRole() == User.Role.MANAGER) {
            if (manager.getDepartment() == null || leaveRequest.getUser().getDepartment() == null ||
                !manager.getDepartment().getId().equals(leaveRequest.getUser().getDepartment().getId())) {
                throw new com.clubmanagement.club_management.exception.BadRequestException("You can only approve or reject leave requests for members in your own department");
            }
        }
        
        leaveRequest.setStatus(newStatus);
        if (newStatus == LeaveRequest.LeaveStatus.REJECTED) {
            leaveRequest.setRejectReason(rejectReason);
        } else if (newStatus == LeaveRequest.LeaveStatus.APPROVED) {
            java.util.Optional<Attendance> existingAttendance = 
                attendanceRepository.findBySessionIdAndUserId(leaveRequest.getSession().getId(), leaveRequest.getUser().getId());
            if (existingAttendance.isPresent()) {
                Attendance attendance = existingAttendance.get();
                attendance.setStatus(Attendance.AttendanceStatus.EXCUSED);
                attendance.setNote("Excused via LeaveRequest approval");
                attendanceRepository.save(attendance);
            } else {
                Attendance attendance = Attendance.builder()
                        .session(leaveRequest.getSession())
                        .user(leaveRequest.getUser())
                        .status(Attendance.AttendanceStatus.EXCUSED)
                        .note("Excused via LeaveRequest approval")
                        .build();
                attendanceRepository.save(attendance);
            }
        }
        
        LeaveRequest saved = leaveRequestRepository.save(leaveRequest);
        auditLogService.log("UPDATE_LEAVE_STATUS", "LeaveRequest", saved.getId(), "Manager: " + managerEmail + " updated status to: " + newStatus);
        return mapToResponse(saved);
    }

    private LeaveRequestResponse mapToResponse(LeaveRequest lr) {
        return LeaveRequestResponse.builder()
                .id(lr.getId())
                .userId(lr.getUser().getId())
                .userName(lr.getUser().getFullName())
                .sessionId(lr.getSession().getId())
                .sessionTitle(lr.getSession().getTitle())
                .reason(lr.getReason())
                .rejectReason(lr.getRejectReason())
                .status(lr.getStatus().name())
                .createdAt(lr.getCreatedAt())
                .updatedAt(lr.getUpdatedAt())
                .build();
    }
}
