package com.clubmanagement.club_management.service;

import com.clubmanagement.club_management.exception.BadRequestException;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.time.Instant;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
public class QrAttendanceService {

    // QR Code token hết hạn sau 30 giây (chống gian lận)
    private static final long QR_EXPIRATION_MS = 30_000L;

    @Value("${app.qr.secret:default_qr_secret_key_needs_to_be_long_enough_for_hs512_padding}")
    private String secret;

    private Key getKey() {
        byte[] keyBytes = secret.getBytes();
        // Ensure key is at least 512 bits for HS512
        byte[] paddedKey = new byte[64];
        System.arraycopy(keyBytes, 0, paddedKey, 0, Math.min(keyBytes.length, 64));
        return Keys.hmacShaKeyFor(paddedKey);
    }

    /**
     * Sinh QR Token cho một buổi tập. Token hết hạn sau 30 giây.
     * Admin sẽ liên tục refresh trang để lấy token mới hiển thị lên màn hình.
     */
    public Map<String, Object> generateQrToken(Long sessionId) {
        Date expiresAt = Date.from(Instant.now().plusMillis(QR_EXPIRATION_MS));

        String token = Jwts.builder()
                .claim("sessionId", sessionId)
                .claim("type", "QR_CHECKIN")
                .setIssuedAt(new Date())
                .setExpiration(expiresAt)
                .signWith(getKey(), SignatureAlgorithm.HS512)
                .compact();

        Map<String, Object> result = new HashMap<>();
        result.put("qrToken", token);
        result.put("sessionId", sessionId);
        result.put("expiresAt", expiresAt.toInstant().toString());
        result.put("validForSeconds", QR_EXPIRATION_MS / 1000);
        // Tạo QR URL cho Frontend render thành QR Code
        result.put("qrContent", "club-checkin://?token=" + token);
        return result;
    }

    /**
     * Xác thực QR Token từ Member quét mã QR.
     * Trả về sessionId nếu hợp lệ, ném exception nếu hết hạn hoặc sai.
     */
    public Long validateQrToken(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(getKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            String type = claims.get("type", String.class);
            if (!"QR_CHECKIN".equals(type)) {
                throw new BadRequestException("Invalid QR token type");
            }

            return claims.get("sessionId", Long.class);
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            throw new BadRequestException("QR Code has expired. Please ask the Admin to refresh the QR Code.");
        } catch (Exception e) {
            throw new BadRequestException("Invalid QR Code: " + e.getMessage());
        }
    }
}
