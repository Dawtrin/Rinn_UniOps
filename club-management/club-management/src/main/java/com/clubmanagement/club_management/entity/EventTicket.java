package com.clubmanagement.club_management.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "event_tickets", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"event_id", "email"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(nullable = false, length = 150)
    private String email;

    @Column(length = 20)
    private String phone;

    @Column(name = "ticket_code", nullable = false, unique = true, length = 100)
    private String ticketCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TicketStatus status = TicketStatus.REGISTERED;

    @Column(name = "check_in_time")
    private LocalDateTime checkInTime;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum TicketStatus {
        REGISTERED, CHECKED_IN
    }
}
