package com.clubmanagement.club_management.controller;

import com.clubmanagement.club_management.dto.request.LoginRequest;
import com.clubmanagement.club_management.dto.request.TokenRefreshRequest;
import com.clubmanagement.club_management.dto.response.AuthResponse;
import com.clubmanagement.club_management.dto.response.TokenRefreshResponse;
import com.clubmanagement.club_management.dto.response.UserResponse;
import com.clubmanagement.club_management.security.JwtFilter;
import com.clubmanagement.club_management.security.JwtUtil;
import com.clubmanagement.club_management.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AuthController.class)
@AutoConfigureMockMvc(addFilters = false) // Disable spring security filters for endpoint tests
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @MockBean
    private UserDetailsService userDetailsService;

    @MockBean
    private JwtUtil jwtUtil;

    @MockBean
    private JwtFilter jwtFilter;

    @Test
    void login_ReturnsTokenAndUser() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("test@club.com");
        request.setPassword("password123");

        UserResponse userResponse = UserResponse.builder()
                .id(1L)
                .email("test@club.com")
                .fullName("Test User")
                .role("MEMBER")
                .build();

        AuthResponse authResponse = AuthResponse.builder()
                .token("test-access-token")
                .refreshToken("test-refresh-token")
                .user(userResponse)
                .build();

        when(authService.login(any(LoginRequest.class))).thenReturn(authResponse);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Login successful"))
                .andExpect(jsonPath("$.data.token").value("test-access-token"))
                .andExpect(jsonPath("$.data.refreshToken").value("test-refresh-token"))
                .andExpect(jsonPath("$.data.user.email").value("test@club.com"));
    }

    @Test
    void refresh_ReturnsNewTokens() throws Exception {
        TokenRefreshRequest request = new TokenRefreshRequest();
        request.setRefreshToken("old-refresh-token");

        TokenRefreshResponse refreshResponse = TokenRefreshResponse.builder()
                .accessToken("new-access-token")
                .refreshToken("new-refresh-token")
                .build();

        when(authService.refreshToken(any(TokenRefreshRequest.class))).thenReturn(refreshResponse);

        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Token refreshed successfully"))
                .andExpect(jsonPath("$.data.accessToken").value("new-access-token"))
                .andExpect(jsonPath("$.data.refreshToken").value("new-refresh-token"));
    }

    @Test
    void refresh_InvalidToken_ReturnsUnauthorized() throws Exception {
        TokenRefreshRequest request = new TokenRefreshRequest();
        request.setRefreshToken("invalid-refresh-token");

        when(authService.refreshToken(any(TokenRefreshRequest.class)))
                .thenThrow(new com.clubmanagement.club_management.exception.UnauthorizedException("Refresh token is not in database!"));

        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Refresh token is not in database!"));
    }
}
