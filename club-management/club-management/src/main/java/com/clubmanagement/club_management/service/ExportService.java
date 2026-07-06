package com.clubmanagement.club_management.service;

import com.clubmanagement.club_management.entity.Attendance;
import com.clubmanagement.club_management.entity.SelfEvaluation;
import com.clubmanagement.club_management.repository.AttendanceRepository;
import com.clubmanagement.club_management.repository.SelfEvaluationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.PrintWriter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExportService {

    private final AttendanceRepository attendanceRepository;
    private final SelfEvaluationRepository selfEvaluationRepository;

    public void exportAttendanceToCsv(PrintWriter writer, Long sessionId) {
        List<Attendance> attendances = attendanceRepository.findBySessionId(sessionId);
        writer.println("ID,Session,User,CheckInTime,CheckOutTime,Status,Note");
        
        for (Attendance a : attendances) {
            writer.printf("%d,%s,%s,%s,%s,%s,%s\n",
                    a.getId(),
                    escapeCsv(a.getSession().getTitle()),
                    escapeCsv(a.getUser().getFullName()),
                    a.getCheckInTime() != null ? a.getCheckInTime().toString() : "",
                    a.getCheckOutTime() != null ? a.getCheckOutTime().toString() : "",
                    a.getStatus().name(),
                    escapeCsv(a.getNote())
            );
        }
    }

    public void exportEvaluationsToCsv(PrintWriter writer, String month) {
        List<SelfEvaluation> evaluations = selfEvaluationRepository.findAll().stream()
                .filter(e -> e.getEvalMonth().equals(month))
                .toList();

        writer.println("ID,User,Month,Status,ManagerGrade,ManagerScore,SubmittedAt");
        
        for (SelfEvaluation e : evaluations) {
            String grade = e.getManagerEvaluation() != null ? e.getManagerEvaluation().getGrade().name() : "N/A";
            String score = e.getManagerEvaluation() != null ? e.getManagerEvaluation().getFinalScore().toString() : "N/A";

            writer.printf("%d,%s,%s,%s,%s,%s,%s\n",
                    e.getId(),
                    escapeCsv(e.getUser().getFullName()),
                    e.getEvalMonth(),
                    e.getStatus().name(),
                    grade,
                    score,
                    e.getSubmittedAt() != null ? e.getSubmittedAt().toString() : ""
            );
        }
    }

    private String escapeCsv(String data) {
        if (data == null) return "";
        String escapedData = data.replaceAll("\\R", " ");
        if (escapedData.contains(",") || escapedData.contains("\"") || escapedData.contains("'")) {
            escapedData = escapedData.replace("\"", "\"\"");
            escapedData = "\"" + escapedData + "\"";
        }
        return escapedData;
    }
}
