package com.clubmanagement.club_management.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SelfEvaluationRequest {
    @NotBlank(message = "Evaluation month is required (YYYY-MM)")
    private String evalMonth;
    
    private String content;
    private String achievements;
    private String improvements;
}
