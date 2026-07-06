package com.clubmanagement.club_management.controller;

import com.clubmanagement.club_management.dto.response.ApiResponse;
import com.clubmanagement.club_management.entity.Notification;
import com.clubmanagement.club_management.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /** #29 — Lấy tất cả thông báo của người dùng hiện tại */
    @GetMapping
    public ResponseEntity<ApiResponse<List<Notification>>> getMyNotifications(Authentication authentication) {
        List<Notification> notifications = notificationService.getNotificationsForUser(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Notifications retrieved", notifications));
    }

    /** #29 — Đếm số thông báo chưa đọc */
    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount(Authentication authentication) {
        long count = notificationService.getUnreadCount(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Unread count", Map.of("unreadCount", count)));
    }

    /** #29 — Đánh dấu một thông báo là đã đọc */
    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable Long id, Authentication authentication) {
        notificationService.markAsRead(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Notification marked as read"));
    }

    /** #29 — Đánh dấu tất cả thông báo là đã đọc */
    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(Authentication authentication) {
        notificationService.markAllAsRead(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("All notifications marked as read"));
    }

    /** #29 — Xóa một thông báo */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(@PathVariable Long id, Authentication authentication) {
        notificationService.deleteNotification(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Notification deleted"));
    }
}
