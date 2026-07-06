package com.clubmanagement.club_management.service;

import com.clubmanagement.club_management.entity.Notification;
import com.clubmanagement.club_management.entity.User;
import com.clubmanagement.club_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GamificationService {

    private final UserRepository userRepository;
    private final NotificationService notificationService;

    // 100 XP to level up
    private static final int XP_PER_LEVEL = 100;

    public void addXp(User user, int xpAmount, String reason) {
        int currentXp = user.getXp() != null ? user.getXp() : 0;
        int currentLevel = user.getLevel() != null ? user.getLevel() : 1;
        
        int newXp = currentXp + xpAmount;
        int newLevel = (newXp / XP_PER_LEVEL) + 1;
        
        user.setXp(newXp);
        
        if (newLevel > currentLevel) {
            user.setLevel(newLevel);
            // Send level up notification
            Notification notification = Notification.builder()
                    .user(user)
                    .type(Notification.NotificationType.LEVEL_UP) 
                    .title("🎉 Cấp độ mới!")
                    .message("Chúc mừng! Bạn đã đạt Cấp độ " + newLevel + ". Hãy tiếp tục tích cực hoạt động nhé!")
                    .build();
            notificationService.sendToUser(user.getId(), notification);
        }
        
        userRepository.save(user);
    }
    
    public List<User> getLeaderboard() {
        return userRepository.findTop10ByIsActiveTrueOrderByXpDesc();
    }
}
