package com.clubmanagement.club_management.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "team_members", uniqueConstraints = @UniqueConstraint(columnNames = {"team_id", "user_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamMember {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    @JsonIgnoreProperties({"department", "leader", "hibernateLazyInitializer", "handler"})
    private Team team;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"department", "hibernateLazyInitializer", "handler"})
    private User user;

    @Column(name = "joined_at", updatable = false)
    private LocalDateTime joinedAt;

    @PrePersist
    protected void onCreate() {
        joinedAt = LocalDateTime.now();
    }
}
