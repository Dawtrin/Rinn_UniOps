package com.clubmanagement.club_management.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsResponse {

    // Overview Stats
    private Long totalMembers;
    private Long totalEvents;
    private Long totalTasks;
    private Long totalSessions;

    // Event stats by status
    private Map<String, Long> eventsByStatus;

    // Task stats by status
    private Map<String, Long> tasksByStatus;

    // Attendance rate per month: month -> attendance %
    private List<MonthlyAttendanceDto> monthlyAttendance;

    // Evaluation stats
    private Map<String, Long> evaluationsByGrade;

    // Top performer
    private String topPerformerName;
    private Integer topPerformerXp;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyAttendanceDto {
        private String month;
        private Long presentCount;
        private Long totalSessions;
        private Double attendanceRate;
    }
}
