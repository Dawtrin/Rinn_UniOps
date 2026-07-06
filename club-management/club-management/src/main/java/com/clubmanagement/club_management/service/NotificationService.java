package com.clubmanagement.club_management.service;

import com.clubmanagement.club_management.entity.Notification;
import com.clubmanagement.club_management.entity.User;
import com.clubmanagement.club_management.repository.NotificationRepository;
import com.clubmanagement.club_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public void sendToUser(Long userId, Notification notification) {
        Notification savedNotification = notificationRepository.save(notification);
        messagingTemplate.convertAndSendToUser(
                userId.toString(),
                "/queue/notifications",
                savedNotification
        );
    }

    /** #29 — Lấy danh sách thông báo theo email */
    public List<Notification> getNotificationsForUser(String email) {
        User user = userRepository.findByEmail(email).orElseThrow();
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
    }

    /** #29 — Đếm số thông báo chưa đọc */
    public long getUnreadCount(String email) {
        User user = userRepository.findByEmail(email).orElseThrow();
        return notificationRepository.countByUserIdAndIsReadFalse(user.getId());
    }

    /** #29 — Đánh dấu một thông báo đã đọc */
    @Transactional
    public void markAsRead(Long notificationId, String email) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new com.clubmanagement.club_management.exception.ResourceNotFoundException("Notification not found"));
        User user = userRepository.findByEmail(email).orElseThrow();
        if (!notification.getUser().getId().equals(user.getId())) {
            throw new com.clubmanagement.club_management.exception.BadRequestException("Not your notification");
        }
        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    /** #29 — Đánh dấu tất cả thông báo đã đọc */
    @Transactional
    public void markAllAsRead(String email) {
        User user = userRepository.findByEmail(email).orElseThrow();
        List<Notification> unread = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        unread.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(unread);
    }

    /** #29 — Xóa một thông báo */
    @Transactional
    public void deleteNotification(Long notificationId, String email) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new com.clubmanagement.club_management.exception.ResourceNotFoundException("Notification not found"));
        User user = userRepository.findByEmail(email).orElseThrow();
        if (!notification.getUser().getId().equals(user.getId())) {
            throw new com.clubmanagement.club_management.exception.BadRequestException("Not your notification");
        }
        notificationRepository.delete(notification);
    }
}
