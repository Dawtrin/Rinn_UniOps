package com.clubmanagement.club_management.service;

import com.clubmanagement.club_management.dto.request.LoginRequest;
import com.clubmanagement.club_management.dto.request.RegisterRequest;
import com.clubmanagement.club_management.dto.response.AuthResponse;
import com.clubmanagement.club_management.entity.RefreshToken;
import com.clubmanagement.club_management.entity.User;
import com.clubmanagement.club_management.repository.UserRepository;
import com.clubmanagement.club_management.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private UserDetailsService userDetailsService;
    @Mock
    private JwtUtil jwtUtil;
    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private RefreshTokenService refreshTokenService;
    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private AuthService authService;

    private User user;
    private RefreshToken refreshToken;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(1L)
                .fullName("Test User")
                .email("test@club.com")
                .passwordHash("hashedPassword")
                .role(User.Role.MEMBER)
                .isActive(true)
                .build();

        refreshToken = RefreshToken.builder()
                .id(1L)
                .user(user)
                .token("dummy-refresh-token")
                .expiryDate(Instant.now().plusSeconds(3600))
                .build();
    }

    @Test
    void login_Success() {
        LoginRequest request = new LoginRequest();
        request.setEmail("test@club.com");
        request.setPassword("password123");

        UserDetails userDetails = mock(UserDetails.class);

        when(userDetailsService.loadUserByUsername("test@club.com")).thenReturn(userDetails);
        when(jwtUtil.generateToken(userDetails)).thenReturn("dummy-jwt-token");
        when(userRepository.findByEmail("test@club.com")).thenReturn(Optional.of(user));
        when(refreshTokenService.createRefreshToken(user.getId())).thenReturn(refreshToken);

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("dummy-jwt-token", response.getToken());
        assertEquals("dummy-refresh-token", response.getRefreshToken());
        assertEquals("test@club.com", response.getUser().getEmail());

        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(auditLogService).log(eq("LOGIN"), eq("User"), eq(1L), eq("test@club.com"), anyString());
    }

    @Test
    void register_Success() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("new@club.com");
        request.setPassword("password123");
        request.setFullName("New User");
        request.setPhone("0912345678");

        User savedUser = User.builder()
                .id(2L)
                .fullName("New User")
                .email("new@club.com")
                .phone("0912345678")
                .role(User.Role.MEMBER)
                .isActive(true)
                .build();

        RefreshToken newRefreshToken = RefreshToken.builder()
                .id(2L)
                .user(savedUser)
                .token("new-refresh-token")
                .expiryDate(Instant.now().plusSeconds(3600))
                .build();

        UserDetails userDetails = mock(UserDetails.class);

        when(userRepository.findByEmail("new@club.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("password123")).thenReturn("hashedPassword");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(userDetailsService.loadUserByUsername("new@club.com")).thenReturn(userDetails);
        when(jwtUtil.generateToken(userDetails)).thenReturn("new-jwt-token");
        when(refreshTokenService.createRefreshToken(2L)).thenReturn(newRefreshToken);

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("new-jwt-token", response.getToken());
        assertEquals("new-refresh-token", response.getRefreshToken());
        assertEquals("new@club.com", response.getUser().getEmail());

        verify(auditLogService).log(eq("REGISTER"), eq("User"), eq(2L), eq("new@club.com"), anyString());
    }

    @Test
    void register_EmailAlreadyExists_ThrowsException() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("test@club.com");

        when(userRepository.findByEmail("test@club.com")).thenReturn(Optional.of(user));

        assertThrows(RuntimeException.class, () -> authService.register(request));
        verify(userRepository, never()).save(any(User.class));
    }
}
