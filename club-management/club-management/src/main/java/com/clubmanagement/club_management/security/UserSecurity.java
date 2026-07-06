package com.clubmanagement.club_management.security;

import com.clubmanagement.club_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component("userSecurity")
@RequiredArgsConstructor
public class UserSecurity {

    private final UserRepository userRepository;

    public boolean isCurrentUser(Authentication authentication, Long userId) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        return userRepository.findByEmail(authentication.getName())
                .map(user -> user.getId().equals(userId))
                .orElse(false);
    }
}
