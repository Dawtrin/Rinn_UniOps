package com.clubmanagement.club_management.service;

import com.clubmanagement.club_management.entity.User;
import com.clubmanagement.club_management.exception.BadRequestException;
import com.clubmanagement.club_management.repository.DepartmentRepository;
import com.clubmanagement.club_management.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private DepartmentRepository departmentRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private UserService userService;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(1L)
                .fullName("Old Name")
                .email("test@club.com")
                .phone("0900000000")
                .passwordHash("oldHash")
                .role(User.Role.MEMBER)
                .isActive(true)
                .build();
    }

    @Test
    void updateUser_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);

        User updated = userService.updateUser(1L, "New Name", "0912345678", "MANAGER", null, true, null, null);

        assertNotNull(updated);
        assertEquals("New Name", updated.getFullName());
        assertEquals("0912345678", updated.getPhone());
        assertEquals(User.Role.MANAGER, updated.getRole());

        verify(auditLogService).log(eq("UPDATE_USER"), eq("User"), eq(1L), anyString());
    }

    @Test
    void updateUser_UpdateEmail_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.findByEmail("new@club.com")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenReturn(user);

        User updated = userService.updateUser(1L, null, null, null, null, null, "new@club.com", null);

        assertNotNull(updated);
        assertEquals("new@club.com", updated.getEmail());
    }

    @Test
    void updateUser_UpdateEmail_Duplicate_ThrowsException() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.findByEmail("existing@club.com")).thenReturn(Optional.of(new User()));

        assertThrows(BadRequestException.class, () ->
            userService.updateUser(1L, null, null, null, null, null, "existing@club.com", null)
        );
    }

    @Test
    void updateUser_UpdatePassword_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("newPassword")).thenReturn("newEncodedHash");
        when(userRepository.save(any(User.class))).thenReturn(user);

        User updated = userService.updateUser(1L, null, null, null, null, null, null, "newPassword");

        assertNotNull(updated);
        assertEquals("newEncodedHash", updated.getPasswordHash());
    }

    @Test
    void updateMyProfile_Success() {
        when(userRepository.findByEmail("test@club.com")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);

        User updated = userService.updateMyProfile("test@club.com", "My New Name", "0987654321");

        assertNotNull(updated);
        assertEquals("My New Name", updated.getFullName());
        assertEquals("0987654321", updated.getPhone());

        verify(auditLogService).log(eq("UPDATE_PROFILE"), eq("User"), eq(1L), anyString());
    }

    @Test
    void changePassword_Success() {
        when(userRepository.findByEmail("test@club.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("oldPassword", "oldHash")).thenReturn(true);
        when(passwordEncoder.encode("newPassword123")).thenReturn("newHash");
        when(userRepository.save(any(User.class))).thenReturn(user);

        userService.changePassword("test@club.com", "oldPassword", "newPassword123");

        assertEquals("newHash", user.getPasswordHash());
        verify(auditLogService).log(eq("CHANGE_PASSWORD"), eq("User"), eq(1L), anyString());
    }

    @Test
    void changePassword_IncorrectOldPassword_ThrowsException() {
        when(userRepository.findByEmail("test@club.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongPassword", "oldHash")).thenReturn(false);

        assertThrows(BadRequestException.class, () -> 
            userService.changePassword("test@club.com", "wrongPassword", "newPassword123")
        );
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void changePassword_NewPasswordTooShort_ThrowsException() {
        assertThrows(BadRequestException.class, () -> 
            userService.changePassword("test@club.com", "oldPassword", "123")
        );
    }
}
