package com.clubmanagement.club_management.service;

import com.clubmanagement.club_management.exception.UnauthorizedException;
import com.clubmanagement.club_management.entity.RefreshToken;
import com.clubmanagement.club_management.entity.User;
import com.clubmanagement.club_management.repository.RefreshTokenRepository;
import com.clubmanagement.club_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    @Value("${app.jwt.refresh-expiration:604800000}") // Default 7 days
    private Long refreshExpirationMs;

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;

    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepository.findByToken(token);
    }

    @Transactional
    public RefreshToken createRefreshToken(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        // Delete existing refresh tokens for the user (single device/session refresh token model)
        refreshTokenRepository.deleteByUser(user);

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(UUID.randomUUID().toString())
                .expiryDate(Instant.now().plusMillis(refreshExpirationMs))
                .revoked(false)
                .build();

        return refreshTokenRepository.save(refreshToken);
    }

    @Transactional
    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.getExpiryDate().compareTo(Instant.now()) < 0) {
            refreshTokenRepository.delete(token);
            throw new UnauthorizedException("Refresh token was expired. Please make a new login request");
        }
        if (token.isRevoked()) {
            throw new UnauthorizedException("Refresh token has been revoked");
        }
        return token;
    }

    @Transactional
    public void deleteByUserId(Long userId) {
        userRepository.findById(userId).ifPresent(refreshTokenRepository::deleteByUser);
    }

    @Transactional
    public void deleteByToken(String token) {
        refreshTokenRepository.deleteByToken(token);
    }
}
