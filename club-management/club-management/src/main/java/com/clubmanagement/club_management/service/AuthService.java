package com.clubmanagement.club_management.service;

import com.clubmanagement.club_management.dto.request.LoginRequest;
import com.clubmanagement.club_management.dto.request.RegisterRequest;
import com.clubmanagement.club_management.dto.request.TokenRefreshRequest;
import com.clubmanagement.club_management.dto.response.AuthResponse;
import com.clubmanagement.club_management.dto.response.UserResponse;
import com.clubmanagement.club_management.dto.response.TokenRefreshResponse;
import com.clubmanagement.club_management.exception.UnauthorizedException;
import com.clubmanagement.club_management.entity.User;
import com.clubmanagement.club_management.repository.UserRepository;
import com.clubmanagement.club_management.entity.RefreshToken;
import com.clubmanagement.club_management.entity.PasswordResetToken;
import com.clubmanagement.club_management.repository.PasswordResetTokenRepository;
import com.clubmanagement.club_management.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenService refreshTokenService;
    private final AuditLogService auditLogService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailService emailService;

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        UserDetails userDetails = userDetailsService.loadUserByUsername(request.getEmail());
        String token = jwtUtil.generateToken(userDetails);
        
        User user = userRepository.findByEmail(request.getEmail()).orElseThrow();
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());

        UserResponse userResponse = UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole().name())
                .departmentName(user.getDepartment() != null ? user.getDepartment().getName() : null)
                .departmentId(user.getDepartment() != null ? user.getDepartment().getId() : null)
                .build();

        auditLogService.log("LOGIN", "User", user.getId(), user.getEmail(), "User logged in successfully");

        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken.getToken())
                .user(userResponse)
                .build();
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email is already registered!");
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(User.Role.MEMBER) // New registrations default to MEMBER
                .isActive(true)
                .xp(0)
                .level(1)
                .build();

        User saved = userRepository.save(user);

        UserDetails userDetails = userDetailsService.loadUserByUsername(saved.getEmail());
        String token = jwtUtil.generateToken(userDetails);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(saved.getId());

        UserResponse userResponse = UserResponse.builder()
                .id(saved.getId())
                .fullName(saved.getFullName())
                .email(saved.getEmail())
                .phone(saved.getPhone())
                .avatarUrl(saved.getAvatarUrl())
                .role(saved.getRole().name())
                .build();

        auditLogService.log("REGISTER", "User", saved.getId(), saved.getEmail(), "User registered successfully");

        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken.getToken())
                .user(userResponse)
                .build();
    }

    @Transactional
    public TokenRefreshResponse refreshToken(TokenRefreshRequest request) {
        String requestRefreshToken = request.getRefreshToken();

        return refreshTokenService.findByToken(requestRefreshToken)
                .map(refreshTokenService::verifyExpiration)
                .map(RefreshToken::getUser)
                .map(user -> {
                    UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
                    String token = jwtUtil.generateToken(userDetails);
                    RefreshToken newRefreshToken = refreshTokenService.createRefreshToken(user.getId());
                    return TokenRefreshResponse.builder()
                            .accessToken(token)
                            .refreshToken(newRefreshToken.getToken())
                            .build();
                })
                .orElseThrow(() -> new UnauthorizedException("Refresh token is not in database!"));
    }

    @Transactional
    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Tài khoản email này không tồn tại trong hệ thống!"));

        // Clean up any existing tokens
        passwordResetTokenRepository.deleteByUser(user);

        // Generate reset token
        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .user(user)
                .token(token)
                .expiryDate(Instant.now().plus(Duration.ofMinutes(15)))
                .build();

        passwordResetTokenRepository.save(resetToken);

        // Send email
        String resetLink = "http://localhost/reset-password?token=" + token;
        String emailContent = "<h3>Yêu cầu khôi phục mật khẩu</h3>" +
                "<p>Chào bạn, <strong>" + user.getFullName() + "</strong>,</p>" +
                "<p>Chúng tôi đã nhận được yêu cầu khôi phục mật khẩu của bạn cho hệ thống quản lý Club OS.</p>" +
                "<p>Vui lòng nhấn vào nút bên dưới để tiến hành đổi mật khẩu mới (đường dẫn này có hiệu lực trong 15 phút):</p>" +
                "<p style='margin: 20px 0;'><a href='" + resetLink + "' style='display: inline-block; background-color: #6366f1; color: white; padding: 10px 18px; text-decoration: none; border-radius: 6px; font-weight: bold;'>Đặt lại mật khẩu</a></p>" +
                "<p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>" +
                "<hr style='border: none; border-top: 0.5px solid #eaeaea; margin: 20px 0;'/><p style='font-size: 0.8rem; color: #888;'>Hệ thống quản trị câu lạc bộ Rin UniOps</p>";

        emailService.sendHtmlEmail(user.getEmail(), "[Club OS] Yêu cầu khôi phục mật khẩu của bạn", emailContent);
        auditLogService.log("FORGOT_PASSWORD_REQUEST", "User", user.getId(), user.getEmail(), "Password reset link requested and email sent");
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Đường dẫn khôi phục mật khẩu không hợp lệ!"));

        if (resetToken.isUsed()) {
            throw new RuntimeException("Đường dẫn này đã được sử dụng rồi!");
        }

        if (resetToken.getExpiryDate().isBefore(Instant.now())) {
            throw new RuntimeException("Đường dẫn khôi phục mật khẩu đã hết hạn!");
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        auditLogService.log("RESET_PASSWORD_SUCCESS", "User", user.getId(), user.getEmail(), "Password reset successfully via email link");
    }
}
