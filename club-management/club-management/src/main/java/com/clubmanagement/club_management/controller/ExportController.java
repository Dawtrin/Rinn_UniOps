package com.clubmanagement.club_management.controller;

import com.clubmanagement.club_management.service.ExportService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@RestController
@RequestMapping("/api/export")
@RequiredArgsConstructor
public class ExportController {

    private final ExportService exportService;

    @GetMapping("/attendance/{sessionId}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public void exportAttendance(HttpServletResponse response, @PathVariable Long sessionId) throws IOException {
        response.setContentType("text/csv");
        response.setHeader("Content-Disposition", "attachment; filename=\"attendance_session_" + sessionId + ".csv\"");
        exportService.exportAttendanceToCsv(response.getWriter(), sessionId);
    }

    @GetMapping("/evaluations/{month}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public void exportEvaluations(HttpServletResponse response, @PathVariable String month) throws IOException {
        response.setContentType("text/csv");
        response.setHeader("Content-Disposition", "attachment; filename=\"evaluations_month_" + month + ".csv\"");
        exportService.exportEvaluationsToCsv(response.getWriter(), month);
    }
}
