package com.clubmanagement.club_management.repository;

import com.clubmanagement.club_management.entity.ChatRoomMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChatRoomMemberRepository extends JpaRepository<ChatRoomMember, Long> {
    List<ChatRoomMember> findByRoomId(Long roomId);
    Optional<ChatRoomMember> findByRoomIdAndUserId(Long roomId, Long userId);
    boolean existsByRoomIdAndUserId(Long roomId, Long userId);
    void deleteByRoomIdAndUserId(Long roomId, Long userId);
    List<ChatRoomMember> findByUserId(Long userId);
    void deleteByRoomId(Long roomId);
}
