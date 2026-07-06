package com.clubmanagement.club_management.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionResponse {
    private Long id;
    private Long eventId;
    private String eventTitle;
    private String title;
    private LocalDate sessionDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String location;
    private String type;
    private String notes;
    private LocalDateTime createdAt;
}
