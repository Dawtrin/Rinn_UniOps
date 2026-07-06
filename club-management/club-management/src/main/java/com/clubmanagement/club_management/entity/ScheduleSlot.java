package com.clubmanagement.club_management.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Entity
@Table(name = "schedule_slots")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ScheduleSlot {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_id", nullable = false)
    @JsonIgnore
    private Schedule schedule;

    @Column(name = "day_of_week", nullable = false)
    private Integer dayOfWeek; // 1=Monday, 7=Sunday

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 200)
    private String location;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private SlotType type = SlotType.PRACTICE;

    @Column(length = 7)
    @Builder.Default
    private String color = "#6366f1";

    @Column(columnDefinition = "TEXT")
    private String notes;

    public enum SlotType {
        PRACTICE, MEETING, PERFORMANCE, OTHER
    }
}
