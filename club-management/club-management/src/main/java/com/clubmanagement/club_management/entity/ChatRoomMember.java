package com.clubmanagement.club_management.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "chat_room_members", uniqueConstraints = @UniqueConstraint(columnNames = {"room_id", "user_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatRoomMember {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private ChatRoom room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "joined_at", updatable = false)
    private LocalDateTime joinedAt;

    @Column(name = "last_read")
    private LocalDateTime lastRead;

    @PrePersist
    protected void onCreate() {
        joinedAt = LocalDateTime.now();
    }
}
