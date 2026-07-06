package com.clubmanagement.club_management.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ManagerEvaluationRequest {
    @NotNull(message = "Task score is required")
    @Min(0)
    @Max(100)
    private Integer taskScore;

    @NotNull(message = "Attendance score is required")
    @Min(0)
    @Max(100)
    private Integer attendanceScore;

    @NotNull(message = "Attitude score is required")
    @Min(0)
    @Max(100)
    private Integer attitudeScore;
    
    private String comment;
}
