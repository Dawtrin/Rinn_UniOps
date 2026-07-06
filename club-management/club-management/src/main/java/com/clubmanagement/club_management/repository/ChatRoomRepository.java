package com.clubmanagement.club_management.repository;

import com.clubmanagement.club_management.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
    @Query("SELECT cr FROM ChatRoom cr JOIN ChatRoomMember crm ON cr.id = crm.room.id WHERE crm.user.id = :userId ORDER BY cr.createdAt DESC")
    List<ChatRoom> findRoomsByUserId(@Param("userId") Long userId);

    Optional<ChatRoom> findByTypeAndScopeId(ChatRoom.RoomType type, Long scopeId);

    @Query("SELECT cr FROM ChatRoom cr WHERE cr.type = :type AND cr.id IN " +
           "(SELECT crm1.room.id FROM ChatRoomMember crm1 WHERE crm1.user.id = :userId1) AND cr.id IN " +
           "(SELECT crm2.room.id FROM ChatRoomMember crm2 WHERE crm2.user.id = :userId2)")
    Optional<ChatRoom> findDirectRoom(@Param("userId1") Long userId1, @Param("userId2") Long userId2, @Param("type") ChatRoom.RoomType type);
}
