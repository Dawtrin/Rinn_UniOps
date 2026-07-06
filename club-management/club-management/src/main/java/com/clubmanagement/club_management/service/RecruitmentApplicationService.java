package com.clubmanagement.club_management.service;

import com.clubmanagement.club_management.entity.Department;
import com.clubmanagement.club_management.entity.RecruitmentApplication;
import com.clubmanagement.club_management.entity.User;
import com.clubmanagement.club_management.repository.DepartmentRepository;
import com.clubmanagement.club_management.repository.RecruitmentApplicationRepository;
import com.clubmanagement.club_management.repository.UserRepository;
import com.clubmanagement.club_management.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RecruitmentApplicationService {

    private final RecruitmentApplicationRepository recruitmentRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final AuditLogService auditLogService;

    private void verifyApplicationWriteAccess(RecruitmentApplication app, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getRole() == User.Role.ADMIN) {
            return;
        }
        if (user.getRole() == User.Role.MANAGER) {
            if (user.getDepartment() != null && app.getDepartmentId() != null &&
                user.getDepartment().getId().equals(app.getDepartmentId())) {
                return;
            }
        }
        throw new BadRequestException("You do not have permission to manage candidates in this department");
    }

    @Transactional
    public RecruitmentApplication apply(RecruitmentApplication app) {
        app.setStatus(RecruitmentApplication.ApplicationStatus.SUBMITTED);
        RecruitmentApplication saved = recruitmentRepository.save(app);
        auditLogService.log("SUBMIT_APPLICATION", "RecruitmentApplication", saved.getId(), "Ứng viên " + app.getFullName() + " nộp đơn tuyển dụng");
        return saved;
    }

    public List<RecruitmentApplication> getAllApplications(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getRole() == User.Role.ADMIN) {
            return recruitmentRepository.findAll();
        }
        if (user.getRole() == User.Role.MANAGER && user.getDepartment() != null) {
            return recruitmentRepository.findByDepartmentId(user.getDepartment().getId());
        }
        return java.util.Collections.emptyList();
    }

    public RecruitmentApplication getApplicationById(Long id) {
        return recruitmentRepository.findById(id).orElseThrow(() -> new RuntimeException("Application not found"));
    }

    public RecruitmentApplication getApplicationById(Long id, String email) {
        RecruitmentApplication app = getApplicationById(id);
        verifyApplicationWriteAccess(app, email);
        return app;
    }

    @Transactional
    public RecruitmentApplication evaluate(Long id, Integer score, String comments, String statusStr, LocalDateTime interviewTime, String email) {
        RecruitmentApplication app = getApplicationById(id, email);
        if (score != null) app.setScore(score);
        if (comments != null) app.setComments(comments);
        if (interviewTime != null) app.setInterviewTime(interviewTime);

        if (statusStr != null) {
            RecruitmentApplication.ApplicationStatus targetStatus = RecruitmentApplication.ApplicationStatus.valueOf(statusStr);
            app.setStatus(targetStatus);

            // Gửi email đặt lịch phỏng vấn nếu chuyển sang INTERVIEW_SCHEDULED
            if (targetStatus == RecruitmentApplication.ApplicationStatus.INTERVIEW_SCHEDULED && app.getInterviewTime() != null) {
                sendInterviewEmail(app);
            }
        }

        RecruitmentApplication updated = recruitmentRepository.save(app);
        auditLogService.log("EVALUATE_APPLICATION", "RecruitmentApplication", id, "Đánh giá hồ sơ tuyển dụng của: " + app.getFullName());
        return updated;
    }

    @Transactional
    public User approveApplication(Long id, String email) {
        RecruitmentApplication app = getApplicationById(id, email);
        if (app.getStatus() == RecruitmentApplication.ApplicationStatus.ACCEPTED) {
            throw new RuntimeException("Application is already accepted and user created");
        }

        // Check if user already exists
        if (userRepository.findByEmail(app.getEmail()).isPresent()) {
            throw new RuntimeException("Email của ứng viên đã tồn tại trong hệ thống người dùng!");
        }

        app.setStatus(RecruitmentApplication.ApplicationStatus.ACCEPTED);
        recruitmentRepository.save(app);

        // Tạo tài khoản Member mới
        String rawPassword = UUID.randomUUID().toString().substring(0, 8); // Tạo password tạm 8 ký tự
        
        Department dept = null;
        if (app.getDepartmentId() != null) {
            dept = departmentRepository.findById(app.getDepartmentId()).orElse(null);
        }

        User user = User.builder()
                .fullName(app.getFullName())
                .email(app.getEmail())
                .passwordHash(passwordEncoder.encode(rawPassword))
                .phone(app.getPhone())
                .role(User.Role.MEMBER)
                .department(dept)
                .isActive(true)
                .xp(0)
                .level(1)
                .build();

        User savedUser = userRepository.save(user);

        // Gửi email chào mừng kèm mật khẩu đăng nhập
        sendWelcomeEmail(savedUser, rawPassword);

        auditLogService.log("APPROVE_APPLICATION", "RecruitmentApplication", id, "Phê duyệt ứng tuyển, tạo account thành viên cho: " + app.getEmail());
        return savedUser;
    }

    private void sendInterviewEmail(RecruitmentApplication app) {
        String content = "<h3>Thông báo Lịch phỏng vấn câu lạc bộ</h3>" +
                "<p>Chào bạn <strong>" + app.getFullName() + "</strong>,</p>" +
                "<p>Chúc mừng hồ sơ ứng tuyển của bạn đã vượt qua vòng hồ sơ.</p>" +
                "<p>Chúng tôi trân trọng kính mời bạn đến tham gia buổi phỏng vấn trực tiếp nội bộ:</p>" +
                "<ul>" +
                "  <li><strong>Thời gian:</strong> " + app.getInterviewTime().toString() + "</li>" +
                "  <li><strong>Hình thức/Địa điểm:</strong> Văn phòng câu lạc bộ (Tầng 3 nhà văn hóa sinh viên)</li>" +
                "</ul>" +
                "<p>Vui lòng đến đúng giờ và chuẩn bị trang phục lịch sự. Nếu có thay đổi xin phản hồi lại email này.</p>" +
                "<hr/><p style='font-size:0.8rem;color:#888;'>Hệ thống quản lý Rin UniOps</p>";
        emailService.sendHtmlEmail(app.getEmail(), "[Club OS] Thư mời tham gia phỏng vấn CLB", content);
    }

    private void sendWelcomeEmail(User user, String password) {
        String content = "<h3>Chào mừng thành viên mới! 🎉</h3>" +
                "<p>Chúc mừng bạn <strong>" + user.getFullName() + "</strong> đã chính thức trở thành thành viên của câu lạc bộ.</p>" +
                "<p>Tài khoản hoạt động trên hệ thống <strong>Club OS</strong> của bạn đã được kích hoạt:</p>" +
                "<ul>" +
                "  <li><strong>Email đăng nhập:</strong> " + user.getEmail() + "</li>" +
                "  <li><strong>Mật khẩu tạm thời:</strong> <code style='font-size: 1.1rem; color: #6366f1; font-weight: bold;'>" + password + "</code></li>" +
                "</ul>" +
                "<p>Vui lòng đăng nhập tại <a href='http://localhost/login'>Club OS</a> và tiến hành thay đổi mật khẩu của bạn để đảm bảo bảo mật.</p>" +
                "<hr/><p style='font-size:0.8rem;color:#888;'>Hệ thống quản lý Rin UniOps</p>";
        emailService.sendHtmlEmail(user.getEmail(), "[Club OS] Chào mừng thành viên mới - Tài khoản truy cập hệ thống", content);
    }
}
