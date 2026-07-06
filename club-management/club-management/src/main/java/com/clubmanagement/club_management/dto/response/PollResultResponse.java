package com.clubmanagement.club_management.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PollResultResponse {
    private Long optionId;
    private String optionText;
    private Long votesCount;
}
