package com.clubmanagement.club_management.repository;

import com.clubmanagement.club_management.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    long countByUserIdAndIsReadFalse(Long userId);
}
