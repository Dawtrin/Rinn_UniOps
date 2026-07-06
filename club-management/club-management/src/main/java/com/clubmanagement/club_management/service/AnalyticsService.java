package com.clubmanagement.club_management.service;

import com.clubmanagement.club_management.dto.response.AnalyticsResponse;
import com.clubmanagement.club_management.entity.*;
import com.clubmanagement.club_management.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final TaskRepository taskRepository;
    private final EventSessionRepository sessionRepository;
    private final AttendanceRepository attendanceRepository;
    private final ManagerEvaluationRepository managerEvaluationRepository;

    public AnalyticsResponse getDashboardStats() {
        // === Overview ===
        long totalMembers = userRepository.count();
        long totalEvents = eventRepository.count();
        long totalTasks = taskRepository.count();
        long totalSessions = sessionRepository.count();

        // === Events by Status ===
        Map<String, Long> eventsByStatus = eventRepository.findAll().stream()
                .collect(Collectors.groupingBy(e -> e.getStatus().name(), Collectors.counting()));

        // === Tasks by Status ===
        Map<String, Long> tasksByStatus = taskRepository.findAll().stream()
                .collect(Collectors.groupingBy(t -> t.getStatus().name(), Collectors.counting()));

        // === Monthly Attendance ===
        List<AnalyticsResponse.MonthlyAttendanceDto> monthlyAttendance = buildMonthlyAttendance();

        // === Evaluations by Grade ===
        Map<String, Long> evaluationsByGrade = managerEvaluationRepository.findAll().stream()
                .collect(Collectors.groupingBy(me -> me.getGrade().name(), Collectors.counting()));

        // === Top Performer (highest XP) ===
        User topPerformer = userRepository.findAll().stream()
                .max(Comparator.comparingInt(u -> u.getXp() != null ? u.getXp() : 0))
                .orElse(null);

        return AnalyticsResponse.builder()
                .totalMembers(totalMembers)
                .totalEvents(totalEvents)
                .totalTasks(totalTasks)
                .totalSessions(totalSessions)
                .eventsByStatus(eventsByStatus)
                .tasksByStatus(tasksByStatus)
                .monthlyAttendance(monthlyAttendance)
                .evaluationsByGrade(evaluationsByGrade)
                .topPerformerName(topPerformer != null ? topPerformer.getFullName() : "N/A")
                .topPerformerXp(topPerformer != null ? (topPerformer.getXp() != null ? topPerformer.getXp() : 0) : 0)
                .build();
    }

    private List<AnalyticsResponse.MonthlyAttendanceDto> buildMonthlyAttendance() {
        long totalMembers = userRepository.count();
        long activeMembers = totalMembers > 0 ? totalMembers : 1;
        
        // Group attendances by month (YYYY-MM)
        List<Attendance> all = attendanceRepository.findAll();
        Map<String, Long> presentByMonth = all.stream()
                .filter(a -> a.getCheckInTime() != null)
                .collect(Collectors.groupingBy(
                        a -> a.getCheckInTime().getYear() + "-" + String.format("%02d", a.getCheckInTime().getMonthValue()),
                        Collectors.counting()
                ));

        // Group sessions by month
        Map<String, Long> sessionsByMonth = sessionRepository.findAll().stream()
                .collect(Collectors.groupingBy(
                        s -> s.getSessionDate().getYear() + "-" + String.format("%02d", s.getSessionDate().getMonthValue()),
                        Collectors.counting()
                ));

        // Merge into monthly stats
        Set<String> allMonths = new TreeSet<>();
        allMonths.addAll(presentByMonth.keySet());
        allMonths.addAll(sessionsByMonth.keySet());

        return allMonths.stream().map(month -> {
            long present = presentByMonth.getOrDefault(month, 0L);
            long sessions = sessionsByMonth.getOrDefault(month, 1L); // avoid div/0
            double rate = sessions > 0 ? Math.round((present * 100.0 / (sessions * activeMembers)) * 10.0) / 10.0 : 0.0;

            return AnalyticsResponse.MonthlyAttendanceDto.builder()
                    .month(month)
                    .presentCount(present)
                    .totalSessions(sessions)
                    .attendanceRate(rate)
                    .build();
        }).collect(Collectors.toList());
    }
}
