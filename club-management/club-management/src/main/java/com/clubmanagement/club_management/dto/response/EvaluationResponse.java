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
public class EvaluationResponse {
    private Long id;
    private Long userId;
    private String userName;
    private String evalMonth;
    private String content;
    private String achievements;
    private String improvements;
    private String status;
    private LocalDateTime submittedAt;
    private Long departmentId;
    private String departmentName;
    
    // Manager Evaluation part
    private Long managerId;
    private String managerName;
    private Integer taskScore;
    private Integer attendanceScore;
    private Integer attitudeScore;
    private Integer finalScore;
    private String grade;
    private String managerComment;
    private LocalDateTime evaluatedAt;
}
