package com.clubmanagement.club_management.controller;

import com.clubmanagement.club_management.dto.request.CreateTeamRequest;
import com.clubmanagement.club_management.dto.request.UpdateTeamRequest;
import com.clubmanagement.club_management.dto.request.TeamMemberRequest;
import com.clubmanagement.club_management.dto.response.ApiResponse;
import com.clubmanagement.club_management.entity.Team;
import com.clubmanagement.club_management.entity.TeamMember;
import com.clubmanagement.club_management.entity.User;
import com.clubmanagement.club_management.service.TeamService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<Team>>> getAllTeams(
            @RequestParam(required = false) Long departmentId,
            Authentication authentication) {
        List<Team> teams = departmentId != null
                ? teamService.getTeamsByDepartment(departmentId, authentication.getName())
                : teamService.getAllTeams(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Teams retrieved", teams));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Team>> getTeam(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Team retrieved", teamService.getTeamById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Team>> createTeam(
            @Valid @RequestBody CreateTeamRequest body,
            Authentication authentication) {
        Team team = teamService.createTeam(
                body.getName(),
                body.getDescription(),
                body.getDepartmentId(),
                body.getLeaderId(),
                body.getAvatarColor(),
                authentication.getName()
        );
        return ResponseEntity.ok(ApiResponse.success("Team created", team));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Team>> updateTeam(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTeamRequest body,
            Authentication authentication) {
        Team team = teamService.updateTeam(id, body.getName(), body.getDescription(), body.getAvatarColor(), authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Team updated", team));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deleteTeam(
            @PathVariable Long id,
            Authentication authentication) {
        teamService.deleteTeam(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Team deleted"));
    }

    // ─── Members ─────────────────────────────────────────────

    @GetMapping("/{id}/members")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<User>>> getTeamMembers(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Members retrieved", teamService.getTeamMembers(id)));
    }

    @PostMapping("/{id}/members")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<TeamMember>> addMember(
            @PathVariable Long id,
            @Valid @RequestBody TeamMemberRequest body,
            Authentication authentication) {
        TeamMember tm = teamService.addMember(id, body.getUserId(), authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Member added to team", tm));
    }

    @DeleteMapping("/{id}/members/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @PathVariable Long id,
            @PathVariable Long userId,
            Authentication authentication) {
        teamService.removeMember(id, userId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Member removed from team"));
    }

    @PutMapping("/{id}/leader")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Team>> setLeader(
            @PathVariable Long id,
            @Valid @RequestBody TeamMemberRequest body,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Leader updated", teamService.setLeader(id, body.getUserId(), authentication.getName())));
    }
}
