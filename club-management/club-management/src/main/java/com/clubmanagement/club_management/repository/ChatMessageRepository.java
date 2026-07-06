package com.clubmanagement.club_management.repository;

import com.clubmanagement.club_management.entity.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    Page<ChatMessage> findByRoomIdAndIsDeletedFalseOrderByCreatedAtDesc(Long roomId, Pageable pageable);

    @Query("SELECT COUNT(cm) FROM ChatMessage cm WHERE cm.room.id = :roomId AND cm.createdAt > :since AND cm.isDeleted = false")
    long countUnreadMessages(@Param("roomId") Long roomId, @Param("since") LocalDateTime since);

    @Query("SELECT cm FROM ChatMessage cm WHERE cm.room.id = :roomId AND cm.isDeleted = false ORDER BY cm.createdAt DESC LIMIT 1")
    ChatMessage findLatestMessage(@Param("roomId") Long roomId);

    @Query("SELECT cm FROM ChatMessage cm WHERE cm.room.id = :roomId AND cm.isDeleted = false AND cm.content LIKE %:query% ORDER BY cm.createdAt DESC")
    List<ChatMessage> searchRoomMessages(@Param("roomId") Long roomId, @Param("query") String query);

    void deleteByRoomId(Long roomId);
}
