package com.clubmanagement.club_management.service;

import com.clubmanagement.club_management.entity.*;
import com.clubmanagement.club_management.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ScheduleService {

    private final ScheduleRepository scheduleRepository;
    private final ScheduleSlotRepository scheduleSlotRepository;
    private final UserRepository userRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final EventSessionRepository eventSessionRepository;
    private final TaskRepository taskRepository;
    private final TeamRepository teamRepository;
    private final AuditLogService auditLogService;


    // ─── Schedule CRUD ───────────────────────────────────────

    @Transactional(readOnly = true)
    public List<Schedule> getSchedules(String scopeType, Long scopeId, LocalDate week) {
        Schedule.ScopeType type = Schedule.ScopeType.valueOf(scopeType);
        if (week != null) {
            LocalDate weekStart = week.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            Optional<Schedule> schedule = scheduleRepository.findByScopeTypeAndScopeIdAndWeekStart(type, scopeId, weekStart);
            return schedule.map(List::of).orElse(Collections.emptyList());
        }
        return scheduleRepository.findByScopeTypeAndScopeId(type, scopeId);
    }

    @Transactional
    public Schedule createSchedule(String title, String scopeType, Long scopeId, LocalDate weekStart, String creatorEmail) {
        User creator = userRepository.findByEmail(creatorEmail)
                .orElseThrow(() -> new com.clubmanagement.club_management.exception.ResourceNotFoundException("User not found"));

        Schedule.ScopeType type = Schedule.ScopeType.valueOf(scopeType);
        if (creator.getRole() == User.Role.MANAGER) {
            if (type == Schedule.ScopeType.CLB) {
                throw new com.clubmanagement.club_management.exception.BadRequestException("Managers cannot create CLB-wide schedules");
            }
            if (type == Schedule.ScopeType.DEPARTMENT) {
                if (creator.getDepartment() == null || !creator.getDepartment().getId().equals(scopeId)) {
                    throw new com.clubmanagement.club_management.exception.BadRequestException("You can only create schedules for your own department");
                }
            }
            if (type == Schedule.ScopeType.TEAM) {
                Team team = teamRepository.findById(scopeId)
                        .orElseThrow(() -> new com.clubmanagement.club_management.exception.ResourceNotFoundException("Team not found"));
                if (creator.getDepartment() == null || team.getDepartment() == null ||
                    !creator.getDepartment().getId().equals(team.getDepartment().getId())) {
                    throw new com.clubmanagement.club_management.exception.BadRequestException("You can only create schedules for teams within your department");
                }
            }
        }

        LocalDate start = weekStart.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate end = start.plusDays(6);

        Schedule schedule = scheduleRepository.save(Schedule.builder()
                .title(title)
                .scopeType(type)
                .scopeId(scopeId)
                .weekStart(start)
                .weekEnd(end)
                .createdBy(creator)
                .build());

        auditLogService.log("CREATE_SCHEDULE", "Schedule", schedule.getId(), "Created schedule: " + schedule.getTitle());
        return schedule;
    }

    @Transactional
    public Schedule updateSchedule(Long id, String title, String email) {
        Schedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new com.clubmanagement.club_management.exception.ResourceNotFoundException("Schedule not found"));
        verifyScheduleAccess(schedule, email);
        if (title != null) schedule.setTitle(title);
        Schedule saved = scheduleRepository.save(schedule);
        auditLogService.log("UPDATE_SCHEDULE", "Schedule", saved.getId(), "Updated schedule title to: " + saved.getTitle());
        return saved;
    }

    @Transactional
    public void deleteSchedule(Long id, String email) {
        Schedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new com.clubmanagement.club_management.exception.ResourceNotFoundException("Schedule not found"));
        verifyScheduleAccess(schedule, email);
        scheduleSlotRepository.deleteByScheduleId(id);
        scheduleRepository.delete(schedule);
        auditLogService.log("DELETE_SCHEDULE", "Schedule", id, "Deleted schedule ID: " + id);
    }

    @Transactional
    public Schedule publishSchedule(Long id, String email) {
        Schedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new com.clubmanagement.club_management.exception.ResourceNotFoundException("Schedule not found"));
        verifyScheduleAccess(schedule, email);
        schedule.setStatus(Schedule.ScheduleStatus.PUBLISHED);
        Schedule saved = scheduleRepository.save(schedule);
        auditLogService.log("PUBLISH_SCHEDULE", "Schedule", saved.getId(), "Published schedule: " + saved.getTitle());
        return saved;
    }

    // ─── Slots ───────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ScheduleSlot> getSlots(Long scheduleId) {
        return scheduleSlotRepository.findByScheduleIdOrderByDayOfWeekAscStartTimeAsc(scheduleId);
    }

    @Transactional
    public ScheduleSlot createSlot(Long scheduleId, Integer dayOfWeek, LocalTime startTime,
                                    LocalTime endTime, String title, String location,
                                    String type, String color, String notes, String email) {
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new com.clubmanagement.club_management.exception.ResourceNotFoundException("Schedule not found"));
        verifyScheduleAccess(schedule, email);

        ScheduleSlot slot = scheduleSlotRepository.save(ScheduleSlot.builder()
                .schedule(schedule)
                .dayOfWeek(dayOfWeek)
                .startTime(startTime)
                .endTime(endTime)
                .title(title)
                .location(location)
                .type(type != null ? ScheduleSlot.SlotType.valueOf(type) : ScheduleSlot.SlotType.PRACTICE)
                .color(color != null ? color : "#6366f1")
                .notes(notes)
                .build());

        auditLogService.log("CREATE_SCHEDULE_SLOT", "ScheduleSlot", slot.getId(), "Created slot: " + slot.getTitle() + " in schedule: " + schedule.getTitle());
        return slot;
    }

    @Transactional
    public ScheduleSlot updateSlot(Long slotId, String title, Integer dayOfWeek,
                                    LocalTime startTime, LocalTime endTime,
                                    String location, String type, String color, String notes, String email) {
        ScheduleSlot slot = scheduleSlotRepository.findById(slotId)
                .orElseThrow(() -> new com.clubmanagement.club_management.exception.ResourceNotFoundException("Slot not found"));
        verifyScheduleAccess(slot.getSchedule(), email);
        if (title != null) slot.setTitle(title);
        if (dayOfWeek != null) slot.setDayOfWeek(dayOfWeek);
        if (startTime != null) slot.setStartTime(startTime);
        if (endTime != null) slot.setEndTime(endTime);
        if (location != null) slot.setLocation(location);
        if (type != null) slot.setType(ScheduleSlot.SlotType.valueOf(type));
        if (color != null) slot.setColor(color);
        if (notes != null) slot.setNotes(notes);
        ScheduleSlot saved = scheduleSlotRepository.save(slot);
        auditLogService.log("UPDATE_SCHEDULE_SLOT", "ScheduleSlot", saved.getId(), "Updated slot: " + saved.getTitle() + " in schedule: " + saved.getSchedule().getTitle());
        return saved;
    }

    @Transactional
    public void deleteSlot(Long slotId, String email) {
        ScheduleSlot slot = scheduleSlotRepository.findById(slotId)
                .orElseThrow(() -> new com.clubmanagement.club_management.exception.ResourceNotFoundException("Slot not found"));
        verifyScheduleAccess(slot.getSchedule(), email);
        scheduleSlotRepository.delete(slot);
        auditLogService.log("DELETE_SCHEDULE_SLOT", "ScheduleSlot", slotId, "Deleted slot ID: " + slotId);
    }

    // ─── Member's weekly schedule ────────────────────────────

    @Transactional(readOnly = true)
    public Map<String, Object> getMyWeek(String email, LocalDate week) {
        LocalDate weekStart = (week != null ? week : LocalDate.now())
                .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Long userId = user.getId();

        // Find user's team
        List<TeamMember> teams = teamMemberRepository.findByUserId(userId);
        List<ScheduleSlot> allSlots = new ArrayList<>();

        // 1. CLB-wide schedules
        scheduleRepository.findByScopeTypeAndWeekStart(
                Schedule.ScopeType.CLB, weekStart)
                .forEach(s -> allSlots.addAll(scheduleSlotRepository.findByScheduleId(s.getId())));

        // 2. Department schedules
        if (user.getDepartment() != null) {
            scheduleRepository.findByScopeTypeAndScopeIdAndWeekStart(
                    Schedule.ScopeType.DEPARTMENT, user.getDepartment().getId(), weekStart)
                    .ifPresent(s -> allSlots.addAll(scheduleSlotRepository.findByScheduleId(s.getId())));
        }

        // 3. Team schedules
        for (TeamMember tm : teams) {
            Long teamId = tm.getTeam().getId();
            scheduleRepository.findByScopeTypeAndScopeIdAndWeekStart(
                    Schedule.ScopeType.TEAM, teamId, weekStart)
                    .ifPresent(s -> allSlots.addAll(scheduleSlotRepository.findByScheduleId(s.getId())));
        }

        // Deduplicate slots by ID to avoid overlapping rendering in case of overlap configurations
        Set<Long> seenIds = new HashSet<>();
        List<ScheduleSlot> distinctSlots = new ArrayList<>();
        for (ScheduleSlot slot : allSlots) {
            if (seenIds.add(slot.getId())) {
                distinctSlots.add(slot);
            }
        }

        Map<Integer, List<Map<String, Object>>> byDay = new LinkedHashMap<>();
        for (int d = 1; d <= 7; d++) {
            byDay.put(d, new ArrayList<>());
        }

        // Map standard schedule slots
        for (ScheduleSlot slot : distinctSlots) {
            Map<String, Object> slotMap = new LinkedHashMap<>();
            slotMap.put("id", slot.getId());
            slotMap.put("title", slot.getTitle());
            slotMap.put("startTime", slot.getStartTime().toString());
            slotMap.put("endTime", slot.getEndTime().toString());
            slotMap.put("location", slot.getLocation());
            slotMap.put("type", slot.getType().name());
            slotMap.put("color", slot.getColor());
            slotMap.put("notes", slot.getNotes());
            slotMap.put("source", "SCHEDULE");
            byDay.get(slot.getDayOfWeek()).add(slotMap);
        }

        // 4. Event Sessions (from events belonging to user's department)
        if (user.getDepartment() != null) {
            List<EventSession> sessions = eventSessionRepository.findByEventDepartmentIdAndEventStatusInAndSessionDateBetween(
                    user.getDepartment().getId(),
                    List.of(Event.EventStatus.APPROVED, Event.EventStatus.ONGOING, Event.EventStatus.COMPLETED),
                    weekStart,
                    weekStart.plusDays(6));
            for (EventSession session : sessions) {
                Map<String, Object> sessionMap = new LinkedHashMap<>();
                sessionMap.put("id", session.getId());
                sessionMap.put("title", "[" + session.getEvent().getTitle() + "] " + session.getTitle());
                sessionMap.put("startTime", session.getStartTime().toString());
                sessionMap.put("endTime", session.getEndTime().toString());
                sessionMap.put("location", session.getLocation());
                sessionMap.put("type", session.getType().name()); // PRACTICE, REHEARSAL, PERFORMANCE
                
                String color = "#6366f1"; // Default PRACTICE
                if (session.getType() == EventSession.SessionType.REHEARSAL) {
                    color = "#8b5cf6";
                } else if (session.getType() == EventSession.SessionType.PERFORMANCE) {
                    color = "#f43f5e";
                }
                sessionMap.put("color", color);
                sessionMap.put("notes", session.getNotes());
                sessionMap.put("source", "EVENT_SESSION");
                sessionMap.put("eventId", session.getEvent().getId());
                
                int dayVal = session.getSessionDate().getDayOfWeek().getValue();
                byDay.get(dayVal).add(sessionMap);
            }
        }

        // 5. Tasks (assigned to user with deadline in the week)
        List<Task> tasks = taskRepository.findByAssignees_IdAndDeadlineBetween(
                userId, weekStart.atStartOfDay(), weekStart.plusDays(6).atTime(23, 59, 59));
        for (Task task : tasks) {
            Map<String, Object> taskMap = new LinkedHashMap<>();
            taskMap.put("id", task.getId());
            taskMap.put("title", "HẠN CHÓT: " + task.getTitle());
            
            LocalTime taskTime = task.getDeadline().toLocalTime();
            taskMap.put("startTime", taskTime.toString());
            LocalTime endTime = taskTime.plusMinutes(30);
            if (endTime.isBefore(taskTime)) {
                endTime = LocalTime.MAX;
            }
            taskMap.put("endTime", endTime.toString());
            
            taskMap.put("location", "Bảng Kanban Tasks");
            taskMap.put("type", "TASK");
            taskMap.put("color", "#f43f5e");
            taskMap.put("notes", task.getDescription());
            taskMap.put("source", "TASK_DEADLINE");
            taskMap.put("taskId", task.getId());
            
            int dayVal = task.getDeadline().toLocalDate().getDayOfWeek().getValue();
            byDay.get(dayVal).add(taskMap);
        }

        // Sort each day's slots chronologically
        for (int d = 1; d <= 7; d++) {
            byDay.get(d).sort((m1, m2) -> {
                LocalTime t1 = LocalTime.parse((CharSequence) m1.get("startTime"));
                LocalTime t2 = LocalTime.parse((CharSequence) m2.get("startTime"));
                return t1.compareTo(t2);
            });
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("weekStart", weekStart.toString());
        result.put("weekEnd", weekStart.plusDays(6).toString());
        result.put("days", byDay);
        return result;
    }

    private void verifyScheduleAccess(Schedule schedule, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new com.clubmanagement.club_management.exception.ResourceNotFoundException("User not found"));
        if (user.getRole() == User.Role.MANAGER) {
            if (schedule.getScopeType() == Schedule.ScopeType.CLB) {
                throw new com.clubmanagement.club_management.exception.BadRequestException("Managers cannot manage CLB-wide schedules");
            }
            if (schedule.getScopeType() == Schedule.ScopeType.DEPARTMENT) {
                if (user.getDepartment() == null || !user.getDepartment().getId().equals(schedule.getScopeId())) {
                    throw new com.clubmanagement.club_management.exception.BadRequestException("You do not have permission to manage schedules for this department");
                }
            }
            if (schedule.getScopeType() == Schedule.ScopeType.TEAM) {
                Team team = teamRepository.findById(schedule.getScopeId())
                        .orElseThrow(() -> new com.clubmanagement.club_management.exception.ResourceNotFoundException("Team not found"));
                if (user.getDepartment() == null || team.getDepartment() == null ||
                    !user.getDepartment().getId().equals(team.getDepartment().getId())) {
                    throw new com.clubmanagement.club_management.exception.BadRequestException("You do not have permission to manage schedules for this team");
                }
            }
        }
    }
}
