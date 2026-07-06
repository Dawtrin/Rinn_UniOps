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
public class TaskCommentResponse {
    private Long id;
    private Long userId;
    private String userName;
    private String avatarUrl;
    private String content;
    private LocalDateTime createdAt;
}
