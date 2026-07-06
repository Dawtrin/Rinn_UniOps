package com.clubmanagement.club_management.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceResponse {
    private Long id;
    private Long sessionId;
    private String sessionTitle;
    private Long userId;
    private String userName;
    private LocalDateTime checkInTime;
    private LocalDateTime checkOutTime;
    private String status;
    private String note;
}
