package com.clubmanagement.club_management.repository;

import com.clubmanagement.club_management.entity.TeamMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {
    List<TeamMember> findByTeamId(Long teamId);
    Optional<TeamMember> findByTeamIdAndUserId(Long teamId, Long userId);
    List<TeamMember> findByUserId(Long userId);
    void deleteByTeamIdAndUserId(Long teamId, Long userId);
    boolean existsByTeamIdAndUserId(Long teamId, Long userId);
    long countByTeamId(Long teamId);
}
