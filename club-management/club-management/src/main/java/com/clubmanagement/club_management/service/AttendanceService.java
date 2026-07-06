package com.clubmanagement.club_management.service;

import com.clubmanagement.club_management.dto.request.CheckInRequest;
import com.clubmanagement.club_management.dto.response.AttendanceResponse;
import com.clubmanagement.club_management.entity.Attendance;
import com.clubmanagement.club_management.entity.EventSession;
import com.clubmanagement.club_management.entity.User;
import com.clubmanagement.club_management.exception.BadRequestException;
import com.clubmanagement.club_management.exception.ResourceNotFoundException;
import com.clubmanagement.club_management.repository.AttendanceRepository;
import com.clubmanagement.club_management.repository.EventSessionRepository;
import com.clubmanagement.club_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final EventSessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final GamificationService gamificationService;

    public List<AttendanceResponse> getAttendanceBySessionId(Long sessionId, String email) {
        EventSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
        User user = userRepository.findByEmail(email).orElseThrow();
        if (user.getRole() == User.Role.MANAGER) {
            if (user.getDepartment() == null || session.getEvent().getDepartment() == null ||
                !user.getDepartment().getId().equals(session.getEvent().getDepartment().getId())) {
                throw new BadRequestException("You can only view attendance for events in your own department");
            }
        }
        return attendanceRepository.findBySessionId(sessionId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public AttendanceResponse checkIn(CheckInRequest request, String email) {
        User user = userRepository.findByEmail(email).orElseThrow();
        EventSession session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        // Validate user belongs to event's department
        if (user.getRole() == User.Role.MEMBER && session.getEvent().getDepartment() != null) {
            if (user.getDepartment() == null || !user.getDepartment().getId().equals(session.getEvent().getDepartment().getId())) {
                throw new BadRequestException("You can only check in to sessions of your own department");
            }
        }

        // Validate date
        if (!session.getSessionDate().equals(LocalDate.now())) {
            throw new BadRequestException("Can only check in on the day of the session");
        }

        Optional<Attendance> existing = attendanceRepository.findBySessionIdAndUserId(session.getId(), user.getId());
        if (existing.isPresent()) {
            throw new BadRequestException("Already checked in");
        }

        Attendance attendance = Attendance.builder()
                .session(session)
                .user(user)
                .checkInTime(LocalDateTime.now())
                .status(Attendance.AttendanceStatus.PRESENT)
                .note(request.getNote())
                .build();

        Attendance savedAttendance = attendanceRepository.save(attendance);

        // Gamification: +10 XP cho việc điểm danh đúng hạn
        gamificationService.addXp(user, 10, "Tham gia điểm danh sự kiện");

        return mapToResponse(savedAttendance);
    }

    public AttendanceResponse checkOut(Long sessionId, String email) {
        User user = userRepository.findByEmail(email).orElseThrow();
        Attendance attendance = attendanceRepository.findBySessionIdAndUserId(sessionId, user.getId())
                .orElseThrow(() -> new BadRequestException("Must check in first before checking out"));

        if (attendance.getCheckOutTime() != null) {
            throw new BadRequestException("Already checked out");
        }

        attendance.setCheckOutTime(LocalDateTime.now());
        return mapToResponse(attendanceRepository.save(attendance));
    }

    /**
     * #28 — Manager đánh dấu trạng thái điểm danh thủ công (ABSENT, LATE, EXCUSED).
     * Nếu chưa có bản ghi → tạo mới. Nếu đã có → cập nhật trạng thái.
     */
    @org.springframework.transaction.annotation.Transactional
    public AttendanceResponse markAttendance(Long sessionId, Long userId, String statusStr, String note, String managerEmail) {
        EventSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
        
        User manager = userRepository.findByEmail(managerEmail).orElseThrow();
        if (manager.getRole() == User.Role.MANAGER) {
            if (manager.getDepartment() == null || session.getEvent().getDepartment() == null ||
                !manager.getDepartment().getId().equals(session.getEvent().getDepartment().getId())) {
                throw new BadRequestException("You can only manage attendance for events in your own department");
            }
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Attendance.AttendanceStatus status;
        try {
            status = Attendance.AttendanceStatus.valueOf(statusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid status. Valid values: PRESENT, ABSENT, LATE, EXCUSED");
        }
        if (status == Attendance.AttendanceStatus.PRESENT) {
            throw new BadRequestException("Use check-in endpoint to mark PRESENT");
        }

        Optional<Attendance> existing = attendanceRepository.findBySessionIdAndUserId(sessionId, userId);
        Attendance attendance;
        if (existing.isPresent()) {
            attendance = existing.get();
            attendance.setStatus(status);
            if (note != null) attendance.setNote(note);
        } else {
            attendance = Attendance.builder()
                    .session(session)
                    .user(user)
                    .status(status)
                    .note(note)
                    .build();
        }
        return mapToResponse(attendanceRepository.save(attendance));
    }

    /**
     * #28 — Tự động đánh dấu ABSENT cho những thành viên chưa điểm danh sau khi session kết thúc.
     */
    @org.springframework.transaction.annotation.Transactional
    public int autoMarkAbsent(Long sessionId, String managerEmail) {
        EventSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        User manager = userRepository.findByEmail(managerEmail).orElseThrow();
        if (manager.getRole() == User.Role.MANAGER) {
            if (manager.getDepartment() == null || session.getEvent().getDepartment() == null ||
                !manager.getDepartment().getId().equals(session.getEvent().getDepartment().getId())) {
                throw new BadRequestException("You can only manage attendance for events in your own department");
            }
        }

        if (session.getSessionDate().isAfter(LocalDate.now())) {
            throw new BadRequestException("Cannot auto-mark absent before session ends");
        }

        List<User> deptMembers = userRepository.findByDepartmentId(session.getEvent().getDepartment().getId());
        List<Long> checkedInIds = attendanceRepository.findBySessionId(sessionId)
                .stream().map(a -> a.getUser().getId()).collect(Collectors.toList());

        int count = 0;
        for (User member : deptMembers) {
            if (!checkedInIds.contains(member.getId())) {
                Attendance absent = Attendance.builder()
                        .session(session)
                        .user(member)
                        .status(Attendance.AttendanceStatus.ABSENT)
                        .note("Auto-marked ABSENT by system")
                        .build();
                attendanceRepository.save(absent);
                count++;
            }
        }
        return count;
    }

    private AttendanceResponse mapToResponse(Attendance attendance) {
        return AttendanceResponse.builder()
                .id(attendance.getId())
                .sessionId(attendance.getSession().getId())
                .sessionTitle(attendance.getSession().getTitle())
                .userId(attendance.getUser().getId())
                .userName(attendance.getUser().getFullName())
                .checkInTime(attendance.getCheckInTime())
                .checkOutTime(attendance.getCheckOutTime())
                .status(attendance.getStatus().name())
                .note(attendance.getNote())
                .build();
    }
}
