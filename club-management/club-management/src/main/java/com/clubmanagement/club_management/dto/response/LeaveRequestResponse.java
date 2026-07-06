package com.clubmanagement.club_management.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class LeaveRequestResponse {
    private Long id;
    private Long userId;
    private String userName;
    private Long sessionId;
    private String sessionTitle;
    private String reason;
    private String rejectReason;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
