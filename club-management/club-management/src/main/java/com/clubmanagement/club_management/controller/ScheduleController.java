package com.clubmanagement.club_management.controller;

import com.clubmanagement.club_management.dto.request.CreateScheduleRequest;
import com.clubmanagement.club_management.dto.request.UpdateScheduleRequest;
import com.clubmanagement.club_management.dto.request.CreateSlotRequest;
import com.clubmanagement.club_management.dto.request.UpdateSlotRequest;
import com.clubmanagement.club_management.dto.response.ApiResponse;
import com.clubmanagement.club_management.entity.Schedule;
import com.clubmanagement.club_management.entity.ScheduleSlot;
import com.clubmanagement.club_management.service.ScheduleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/schedules")
@RequiredArgsConstructor
public class ScheduleController {

    private final ScheduleService scheduleService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<Schedule>>> getSchedules(
            @RequestParam String scopeType,
            @RequestParam Long scopeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate week) {
        List<Schedule> schedules = scheduleService.getSchedules(scopeType, scopeId, week);
        return ResponseEntity.ok(ApiResponse.success("Schedules retrieved", schedules));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Schedule>> createSchedule(
            @Valid @RequestBody CreateScheduleRequest body,
            Authentication authentication) {
        Schedule schedule = scheduleService.createSchedule(body.getTitle(), body.getScopeType(), body.getScopeId(), body.getWeekStart(), authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Schedule created", schedule));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Schedule>> updateSchedule(
            @PathVariable Long id,
            @Valid @RequestBody UpdateScheduleRequest body,
            Authentication authentication) {
        Schedule schedule = scheduleService.updateSchedule(id, body.getTitle(), authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Schedule updated", schedule));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deleteSchedule(@PathVariable Long id, Authentication authentication) {
        scheduleService.deleteSchedule(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Schedule deleted"));
    }

    @PutMapping("/{id}/publish")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Schedule>> publishSchedule(@PathVariable Long id, Authentication authentication) {
        Schedule schedule = scheduleService.publishSchedule(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Schedule published", schedule));
    }

    // ─── Slots ───────────────────────────────────────────────

    @GetMapping("/{id}/slots")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<ScheduleSlot>>> getSlots(@PathVariable Long id) {
        List<ScheduleSlot> slots = scheduleService.getSlots(id);
        return ResponseEntity.ok(ApiResponse.success("Slots retrieved", slots));
    }

    @PostMapping("/{id}/slots")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<ScheduleSlot>> createSlot(
            @PathVariable("id") Long scheduleId,
            @Valid @RequestBody CreateSlotRequest body,
            Authentication authentication) {
        ScheduleSlot slot = scheduleService.createSlot(
                scheduleId, body.getDayOfWeek(), body.getStartTime(), body.getEndTime(),
                body.getTitle(), body.getLocation(), body.getType(), body.getColor(), body.getNotes(),
                authentication.getName()
        );
        return ResponseEntity.ok(ApiResponse.success("Slot created", slot));
    }

    @PutMapping("/slots/{slotId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<ScheduleSlot>> updateSlot(
            @PathVariable Long slotId,
            @Valid @RequestBody UpdateSlotRequest body,
            Authentication authentication) {
        ScheduleSlot slot = scheduleService.updateSlot(
                slotId, body.getTitle(), body.getDayOfWeek(), body.getStartTime(), body.getEndTime(),
                body.getLocation(), body.getType(), body.getColor(), body.getNotes(),
                authentication.getName()
        );
        return ResponseEntity.ok(ApiResponse.success("Slot updated", slot));
    }

    @DeleteMapping("/slots/{slotId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deleteSlot(@PathVariable Long slotId, Authentication authentication) {
        scheduleService.deleteSlot(slotId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Slot deleted"));
    }

    // ─── Member weekly schedule ──────────────────────────────

    @GetMapping("/my-week")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMyWeek(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate week,
            Authentication authentication) {
        Map<String, Object> weekData = scheduleService.getMyWeek(authentication.getName(), week);
        return ResponseEntity.ok(ApiResponse.success("My week retrieved", weekData));
    }
}
