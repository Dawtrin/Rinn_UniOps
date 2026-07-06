package com.clubmanagement.club_management.service;

import com.clubmanagement.club_management.entity.Department;
import com.clubmanagement.club_management.entity.User;
import com.clubmanagement.club_management.exception.BadRequestException;
import com.clubmanagement.club_management.repository.DepartmentRepository;
import com.clubmanagement.club_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserById(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Transactional
    public User updateUser(Long id, String fullName, String phone, String role, Long departmentId, Boolean isActive, String email, String password) {
        User user = getUserById(id);
        if (fullName != null) user.setFullName(fullName);
        if (phone != null) user.setPhone(phone);
        if (role != null) user.setRole(User.Role.valueOf(role));
        if (isActive != null) user.setIsActive(isActive);

        if (email != null && !email.trim().isEmpty() && !email.equalsIgnoreCase(user.getEmail())) {
            if (userRepository.findByEmail(email.trim()).isPresent()) {
                throw new BadRequestException("Email đã được sử dụng bởi tài khoản khác!");
            }
            user.setEmail(email.trim());
        }

        if (password != null && !password.isEmpty()) {
            if (password.length() < 6) {
                throw new BadRequestException("Mật khẩu phải chứa ít nhất 6 ký tự!");
            }
            user.setPasswordHash(passwordEncoder.encode(password));
        }

        if (departmentId != null) {
            Department dept = departmentRepository.findById(departmentId)
                    .orElseThrow(() -> new RuntimeException("Department not found"));
            user.setDepartment(dept);
        } else {
            user.setDepartment(null);
        }

        User updated = userRepository.save(user);
        auditLogService.log("UPDATE_USER", "User", id, "Admin updated user details for: " + user.getEmail());
        return updated;
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = getUserById(id);
        user.setIsActive(false); // Soft delete / lock account
        userRepository.save(user);
        auditLogService.log("LOCK_USER", "User", id, "Admin locked user account: " + user.getEmail());
    }

    public List<com.clubmanagement.club_management.dto.response.UserResponse> getDepartmentMembers(Long departmentId) {
        return userRepository.findByDepartmentId(departmentId).stream()
                .map(user -> com.clubmanagement.club_management.dto.response.UserResponse.builder()
                        .id(user.getId())
                        .fullName(user.getFullName())
                        .email(user.getEmail())
                        .avatarUrl(user.getAvatarUrl())
                        .build())
                .collect(java.util.stream.Collectors.toList());
    }

    /** #38 — Cập nhật thông tin cá nhân (chỉ fullName + phone) */
    @Transactional
    public User updateMyProfile(String email, String fullName, String phone) {
        User user = getUserByEmail(email);
        if (fullName != null && !fullName.isBlank()) user.setFullName(fullName);
        if (phone != null) user.setPhone(phone);
        User updated = userRepository.save(user);
        auditLogService.log("UPDATE_PROFILE", "User", user.getId(), "User updated profile details");
        return updated;
    }

    /** #38 — Đổi mật khẩu sau khi xác minh mật khẩu cũ */
    @Transactional
    public void changePassword(String email, String oldPassword, String newPassword) {
        if (newPassword == null || newPassword.length() < 6) {
            throw new BadRequestException("New password must be at least 6 characters");
        }
        User user = getUserByEmail(email);
        if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        auditLogService.log("CHANGE_PASSWORD", "User", user.getId(), "User changed password");
    }
}
