package com.clubmanagement.club_management.service;

import com.clubmanagement.club_management.dto.request.AssignMemberRequest;
import com.clubmanagement.club_management.entity.*;
import com.clubmanagement.club_management.repository.*;
import com.clubmanagement.club_management.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TeamService {

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final AuditLogService auditLogService;

    private void verifyTeamWriteAccess(Team team, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getRole() == User.Role.ADMIN) {
            return;
        }
        if (user.getRole() == User.Role.MANAGER) {
            if (user.getDepartment() != null && team.getDepartment() != null &&
                user.getDepartment().getId().equals(team.getDepartment().getId())) {
                return;
            }
        }
        throw new BadRequestException("You do not have permission to modify teams in this department");
    }

    private void verifyDepartmentWriteAccess(Long departmentId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getRole() == User.Role.ADMIN) {
            return;
        }
        if (user.getRole() == User.Role.MANAGER) {
            if (user.getDepartment() != null && user.getDepartment().getId().equals(departmentId)) {
                return;
            }
        }
        throw new BadRequestException("You do not have permission to perform team actions in this department");
    }

    // ─── CRUD ────────────────────────────────────────────────

    public List<Team> getAllTeams(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getRole() == User.Role.ADMIN) {
            return teamRepository.findByIsActiveTrue();
        }
        if (user.getRole() == User.Role.MANAGER && user.getDepartment() != null) {
            return teamRepository.findByDepartmentIdAndIsActiveTrue(user.getDepartment().getId());
        }
        return Collections.emptyList();
    }

    public List<Team> getTeamsByDepartment(Long departmentId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getRole() == User.Role.MANAGER) {
            if (user.getDepartment() == null || !user.getDepartment().getId().equals(departmentId)) {
                throw new BadRequestException("You can only view teams of your own department");
            }
        }
        return teamRepository.findByDepartmentIdAndIsActiveTrue(departmentId);
    }

    public Team getTeamById(Long id) {
        return teamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Team not found"));
    }

    @Transactional
    public Team createTeam(String name, String description, Long departmentId, Long leaderId, String avatarColor, String email) {
        verifyDepartmentWriteAccess(departmentId, email);
        Department dept = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new RuntimeException("Department not found"));

        Team team = Team.builder()
                .name(name)
                .description(description)
                .department(dept)
                .avatarColor(avatarColor != null ? avatarColor : "#6366f1")
                .build();

        if (leaderId != null) {
            User leader = userRepository.findById(leaderId)
                    .orElseThrow(() -> new RuntimeException("Leader not found"));
            team.setLeader(leader);
        }

        Team saved = teamRepository.save(team);
        auditLogService.log("CREATE_TEAM", "Team", saved.getId(), "Created team: " + saved.getName());
        return saved;
    }

    @Transactional
    public Team updateTeam(Long id, String name, String description, String avatarColor, String email) {
        Team team = getTeamById(id);
        verifyTeamWriteAccess(team, email);
        if (name != null) team.setName(name);
        if (description != null) team.setDescription(description);
        if (avatarColor != null) team.setAvatarColor(avatarColor);
        Team saved = teamRepository.save(team);
        auditLogService.log("UPDATE_TEAM", "Team", saved.getId(), "Updated team details for: " + saved.getName());
        return saved;
    }

    @Transactional
    public void deleteTeam(Long id, String email) {
        Team team = getTeamById(id);
        verifyTeamWriteAccess(team, email);
        team.setIsActive(false);
        teamRepository.save(team);
        auditLogService.log("DELETE_TEAM", "Team", id, "Deactivated team ID: " + id);
    }

    // ─── Team Members ────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<User> getTeamMembers(Long teamId) {
        return teamMemberRepository.findByTeamId(teamId).stream()
                .map(TeamMember::getUser)
                .collect(Collectors.toList());
    }

    @Transactional
    public TeamMember addMember(Long teamId, Long userId, String email) {
        Team team = getTeamById(teamId);
        verifyTeamWriteAccess(team, email);
        if (teamMemberRepository.existsByTeamIdAndUserId(teamId, userId)) {
            throw new RuntimeException("User is already a member of this team");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (team.getDepartment() != null) {
            user.setDepartment(team.getDepartment());
            userRepository.save(user);
        }

        TeamMember tm = teamMemberRepository.save(TeamMember.builder()
                .team(team)
                .user(user)
                .build());
        auditLogService.log("ADD_TEAM_MEMBER", "Team", teamId, "Added user " + user.getEmail() + " to team: " + team.getName());
        return tm;
    }

    @Transactional
    public void removeMember(Long teamId, Long userId, String email) {
        Team team = getTeamById(teamId);
        verifyTeamWriteAccess(team, email);
        teamMemberRepository.deleteByTeamIdAndUserId(teamId, userId);
        auditLogService.log("REMOVE_TEAM_MEMBER", "Team", teamId, "Removed user ID " + userId + " from team ID " + teamId);
    }

    @Transactional
    public Team setLeader(Long teamId, Long userId, String email) {
        Team team = getTeamById(teamId);
        verifyTeamWriteAccess(team, email);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        team.setLeader(user);
        Team saved = teamRepository.save(team);
        auditLogService.log("SET_TEAM_LEADER", "Team", teamId, "Set user " + user.getEmail() + " as leader of team: " + team.getName());
        return saved;
    }

    // ─── HR ──────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<User> getUnassignedMembers() {
        List<User> allMembers = userRepository.findByRole(User.Role.MEMBER);
        Set<Long> assignedIds = teamMemberRepository.findAll().stream()
                .map(tm -> tm.getUser().getId())
                .collect(Collectors.toSet());
        return allMembers.stream()
                .filter(u -> !assignedIds.contains(u.getId()))
                .collect(Collectors.toList());
    }

    @Transactional
    public void assignMember(Long userId, Long teamId, String email) {
        Team team = getTeamById(teamId);
        verifyTeamWriteAccess(team, email);
        // Remove from any existing team first
        List<TeamMember> existing = teamMemberRepository.findByUserId(userId);
        teamMemberRepository.deleteAll(existing);
        // Add to new team
        addMember(teamId, userId, email);
        auditLogService.log("ASSIGN_TEAM_MEMBER", "Team", teamId, "Assigned user ID " + userId + " to team ID " + teamId);
    }

    @Transactional
    public void bulkAssign(List<AssignMemberRequest> assignments, String email) {
        for (AssignMemberRequest a : assignments) {
            assignMember(a.getUserId(), a.getTeamId(), email);
        }
    }

    // ─── Org Chart ───────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getOrgChart() {
        List<Department> departments = departmentRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();

        for (Department dept : departments) {
            Map<String, Object> deptMap = new LinkedHashMap<>();
            deptMap.put("id", dept.getId());
            deptMap.put("name", dept.getName());
            deptMap.put("description", dept.getDescription());
            deptMap.put("managerId", dept.getManager() != null ? dept.getManager().getId() : null);
            deptMap.put("managerName", dept.getManager() != null ? dept.getManager().getFullName() : null);

            List<Team> teams = teamRepository.findByDepartmentIdAndIsActiveTrue(dept.getId());
            List<Map<String, Object>> teamList = new ArrayList<>();

            for (Team team : teams) {
                Map<String, Object> teamMap = new LinkedHashMap<>();
                teamMap.put("id", team.getId());
                teamMap.put("name", team.getName());
                teamMap.put("avatarColor", team.getAvatarColor());
                teamMap.put("leaderId", team.getLeader() != null ? team.getLeader().getId() : null);
                teamMap.put("leaderName", team.getLeader() != null ? team.getLeader().getFullName() : null);

                List<TeamMember> members = teamMemberRepository.findByTeamId(team.getId());
                List<Map<String, Object>> memberList = members.stream().map(tm -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", tm.getUser().getId());
                    m.put("fullName", tm.getUser().getFullName());
                    m.put("email", tm.getUser().getEmail());
                    m.put("avatarUrl", tm.getUser().getAvatarUrl());
                    m.put("xp", tm.getUser().getXp());
                    m.put("level", tm.getUser().getLevel());
                    m.put("joinedAt", tm.getJoinedAt());
                    return m;
                }).collect(Collectors.toList());

                teamMap.put("memberCount", memberList.size());
                teamMap.put("members", memberList);
                teamList.add(teamMap);
            }

            deptMap.put("teams", teamList);
            result.add(deptMap);
        }

        return result;
    }
}
