package com.clubmanagement.club_management.service;

import com.clubmanagement.club_management.entity.*;
import com.clubmanagement.club_management.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import com.clubmanagement.club_management.exception.BadRequestException;
import com.clubmanagement.club_management.exception.ResourceNotFoundException;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatRoomMemberRepository chatRoomMemberRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    // ─── Rooms ───────────────────────────────────────────────

    public List<Map<String, Object>> getUserRooms(Long userId) {
        List<ChatRoom> rooms = chatRoomRepository.findRoomsByUserId(userId);
        return rooms.stream().map(room -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", room.getId());
            map.put("name", room.getName());
            map.put("type", room.getType().name());
            map.put("scopeId", room.getScopeId());
            map.put("avatarUrl", room.getAvatarUrl());
            map.put("createdAt", room.getCreatedAt());

            // Last message preview
            ChatMessage last = chatMessageRepository.findLatestMessage(room.getId());
            if (last != null) {
                map.put("lastMessage", last.getContent().length() > 60
                        ? last.getContent().substring(0, 60) + "..."
                        : last.getContent());
                map.put("lastMessageTime", last.getCreatedAt());
                map.put("lastSenderName", last.getSender().getFullName());
            }

            // Unread count
            ChatRoomMember membership = chatRoomMemberRepository
                    .findByRoomIdAndUserId(room.getId(), userId).orElse(null);
            if (membership != null) {
                LocalDateTime since = membership.getLastRead() != null ? membership.getLastRead() : membership.getJoinedAt();
                long unread = chatMessageRepository.countUnreadMessages(room.getId(), since);
                map.put("unreadCount", unread);
            } else {
                map.put("unreadCount", 0L);
            }

            // Members (for DM, show other person's name)
            if (room.getType() == ChatRoom.RoomType.DIRECT) {
                List<ChatRoomMember> members = chatRoomMemberRepository.findByRoomId(room.getId());
                members.stream()
                        .filter(m -> !m.getUser().getId().equals(userId))
                        .findFirst()
                        .ifPresent(other -> {
                            map.put("name", other.getUser().getFullName());
                            map.put("avatarUrl", other.getUser().getAvatarUrl());
                            map.put("targetUserId", other.getUser().getId());
                        });
            }

            return map;
        }).collect(Collectors.toList());
    }

    @Transactional
    public ChatRoom createDirectRoom(Long userId, Long targetUserId) {
        // Check if DM already exists
        Optional<ChatRoom> existing = chatRoomRepository.findDirectRoom(userId, targetUserId, ChatRoom.RoomType.DIRECT);
        if (existing.isPresent()) return existing.get();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("Target user not found"));

        ChatRoom room = chatRoomRepository.save(ChatRoom.builder()
                .name(user.getFullName() + " & " + target.getFullName())
                .type(ChatRoom.RoomType.DIRECT)
                .createdBy(user)
                .build());

        chatRoomMemberRepository.save(ChatRoomMember.builder().room(room).user(user).build());
        chatRoomMemberRepository.save(ChatRoomMember.builder().room(room).user(target).build());

        return room;
    }

    @Transactional
    public ChatRoom createGroupRoom(String name, ChatRoom.RoomType type, Long scopeId, Long creatorId, List<Long> memberIds) {
        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        ChatRoom room = chatRoomRepository.save(ChatRoom.builder()
                .name(name)
                .type(type)
                .scopeId(scopeId)
                .createdBy(creator)
                .build());

        // Add creator
        chatRoomMemberRepository.save(ChatRoomMember.builder().room(room).user(creator).build());

        // Add members
        for (Long memberId : memberIds) {
            if (!memberId.equals(creatorId)) {
                User member = userRepository.findById(memberId).orElse(null);
                if (member != null) {
                    chatRoomMemberRepository.save(ChatRoomMember.builder().room(room).user(member).build());
                }
            }
        }

        return room;
    }

    // ─── Messages ────────────────────────────────────────────

    public Page<Map<String, Object>> getRoomMessages(Long roomId, String email, int page, int size) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (!chatRoomMemberRepository.existsByRoomIdAndUserId(roomId, user.getId())) {
            throw new BadRequestException("You are not a member of this chat room");
        }
        Page<ChatMessage> messages = chatMessageRepository
                .findByRoomIdAndIsDeletedFalseOrderByCreatedAtDesc(
                        roomId, PageRequest.of(page, size));

        return messages.map(msg -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", msg.getId());
            map.put("content", msg.getContent());
            map.put("type", msg.getType().name());
            map.put("senderId", msg.getSender().getId());
            map.put("senderName", msg.getSender().getFullName());
            map.put("senderAvatar", msg.getSender().getAvatarUrl());
            map.put("createdAt", msg.getCreatedAt());
            if (msg.getReplyTo() != null) {
                Map<String, Object> reply = new LinkedHashMap<>();
                reply.put("id", msg.getReplyTo().getId());
                reply.put("content", msg.getReplyTo().getContent());
                reply.put("senderName", msg.getReplyTo().getSender().getFullName());
                map.put("replyTo", reply);
            }
            map.put("reactions", msg.getReactions());
            return map;
        });
    }

    @Transactional
    public Map<String, Object> sendMessage(Long roomId, Long senderId, String content, String type, Long replyToId) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Verify membership
        if (!chatRoomMemberRepository.existsByRoomIdAndUserId(roomId, senderId)) {
            throw new RuntimeException("You are not a member of this room");
        }

        ChatMessage.ChatMessageBuilder builder = ChatMessage.builder()
                .room(room)
                .sender(sender)
                .content(content)
                .type(type != null ? ChatMessage.MessageType.valueOf(type) : ChatMessage.MessageType.TEXT);

        if (replyToId != null) {
            ChatMessage replyTo = chatMessageRepository.findById(replyToId).orElse(null);
            builder.replyTo(replyTo);
        }

        ChatMessage saved = chatMessageRepository.save(builder.build());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", saved.getId());
        result.put("roomId", roomId);
        result.put("content", saved.getContent());
        result.put("type", saved.getType().name());
        result.put("senderId", senderId);
        result.put("senderName", sender.getFullName());
        result.put("senderAvatar", sender.getAvatarUrl());
        result.put("createdAt", saved.getCreatedAt());
        result.put("reactions", saved.getReactions());
        if (saved.getReplyTo() != null) {
            Map<String, Object> reply = new LinkedHashMap<>();
            reply.put("id", saved.getReplyTo().getId());
            reply.put("content", saved.getReplyTo().getContent());
            reply.put("senderName", saved.getReplyTo().getSender().getFullName());
            result.put("replyTo", reply);
        }

        // Broadcast via WebSocket
        messagingTemplate.convertAndSend("/topic/chat/" + roomId, result);

        return result;
    }

    @Transactional
    public void deleteMessage(Long messageId, Long userId) {
        ChatMessage msg = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        if (!msg.getSender().getId().equals(userId)) {
            throw new RuntimeException("You can only delete your own messages");
        }
        msg.setIsDeleted(true);
        chatMessageRepository.save(msg);
    }

    public List<Map<String, Object>> getRoomMembers(Long roomId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (!chatRoomMemberRepository.existsByRoomIdAndUserId(roomId, user.getId())) {
            throw new BadRequestException("You are not a member of this chat room");
        }
        return chatRoomMemberRepository.findByRoomId(roomId).stream()
                .map(crm -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", crm.getUser().getId());
                    m.put("fullName", crm.getUser().getFullName());
                    m.put("email", crm.getUser().getEmail());
                    m.put("avatarUrl", crm.getUser().getAvatarUrl());
                    m.put("joinedAt", crm.getJoinedAt());
                    return m;
                }).collect(Collectors.toList());
    }

    public Map<String, Long> getUnreadCount(Long userId) {
        List<ChatRoomMember> memberships = chatRoomMemberRepository.findByUserId(userId);
        long total = 0;
        for (ChatRoomMember m : memberships) {
            LocalDateTime since = m.getLastRead() != null ? m.getLastRead() : m.getJoinedAt();
            total += chatMessageRepository.countUnreadMessages(m.getRoom().getId(), since);
        }
        return Map.of("totalUnread", total);
    }

    @Transactional
    public void markAsRead(Long roomId, Long userId) {
        ChatRoomMember membership = chatRoomMemberRepository
                .findByRoomIdAndUserId(roomId, userId)
                .orElseThrow(() -> new RuntimeException("Not a member"));
        membership.setLastRead(LocalDateTime.now());
        chatRoomMemberRepository.save(membership);
    }

    @Transactional
    public void deleteRoom(Long roomId, String email) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat room not found"));
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getRole() != User.Role.ADMIN && !room.getCreatedBy().getId().equals(user.getId())) {
            throw new BadRequestException("Only ADMIN or the room creator can delete this room");
        }
        chatMessageRepository.deleteByRoomId(roomId);
        chatRoomMemberRepository.deleteByRoomId(roomId);
        chatRoomRepository.deleteById(roomId);
    }

    @Transactional
    public Map<Long, String> toggleReaction(Long messageId, Long userId, String emoji) {
        ChatMessage msg = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        
        Map<Long, String> reactions = msg.getReactions();
        if (emoji.equals(reactions.get(userId))) {
            reactions.remove(userId);
        } else {
            reactions.put(userId, emoji);
        }
        
        ChatMessage saved = chatMessageRepository.save(msg);
        
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("messageId", messageId);
        payload.put("reactions", saved.getReactions());
        messagingTemplate.convertAndSend("/topic/chat/" + msg.getRoom().getId() + "/reaction", payload);
        
        return saved.getReactions();
    }

    public List<Map<String, Object>> searchMessages(Long roomId, String query, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (!chatRoomMemberRepository.existsByRoomIdAndUserId(roomId, user.getId())) {
            throw new BadRequestException("You are not a member of this chat room");
        }
        List<ChatMessage> list = chatMessageRepository.searchRoomMessages(roomId, query);
        return list.stream().map(msg -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", msg.getId());
            map.put("content", msg.getContent());
            map.put("type", msg.getType().name());
            map.put("senderId", msg.getSender().getId());
            map.put("senderName", msg.getSender().getFullName());
            map.put("senderAvatar", msg.getSender().getAvatarUrl());
            map.put("createdAt", msg.getCreatedAt());
            if (msg.getReplyTo() != null) {
                Map<String, Object> reply = new LinkedHashMap<>();
                reply.put("id", msg.getReplyTo().getId());
                reply.put("content", msg.getReplyTo().getContent());
                reply.put("senderName", msg.getReplyTo().getSender().getFullName());
                map.put("replyTo", reply);
            }
            map.put("reactions", msg.getReactions());
            return map;
        }).collect(Collectors.toList());
    }

    private static final Map<Long, Long> onlineUsers = new java.util.concurrent.ConcurrentHashMap<>();

    public void updateHeartbeat(Long userId) {
        onlineUsers.put(userId, System.currentTimeMillis());
    }

    public Set<Long> getOnlineUsers() {
        long activeThreshold = System.currentTimeMillis() - 45000;
        return onlineUsers.entrySet().stream()
                .filter(entry -> entry.getValue() > activeThreshold)
                .map(Map.Entry::getKey)
                .collect(Collectors.toSet());
    }
}
