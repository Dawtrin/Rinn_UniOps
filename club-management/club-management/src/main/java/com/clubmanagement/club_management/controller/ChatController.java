package com.clubmanagement.club_management.controller;

import com.clubmanagement.club_management.dto.response.ApiResponse;
import com.clubmanagement.club_management.entity.ChatRoom;
import com.clubmanagement.club_management.entity.User;
import com.clubmanagement.club_management.repository.UserRepository;
import com.clubmanagement.club_management.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    private User getAuthenticatedUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    @GetMapping("/rooms")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getRooms(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        List<Map<String, Object>> rooms = chatService.getUserRooms(user.getId());
        return ResponseEntity.ok(ApiResponse.success("Rooms retrieved", rooms));
    }

    @PostMapping("/rooms/direct")
    public ResponseEntity<ApiResponse<ChatRoom>> createDirectRoom(
            @RequestBody Map<String, Long> body,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        Long targetUserId = body.get("targetUserId");
        ChatRoom room = chatService.createDirectRoom(user.getId(), targetUserId);
        return ResponseEntity.ok(ApiResponse.success("Direct room created", room));
    }

    @PostMapping("/rooms/group")
    public ResponseEntity<ApiResponse<ChatRoom>> createGroupRoom(
            @RequestBody Map<String, Object> body,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        String name = (String) body.get("name");
        String typeStr = (String) body.get("type");
        ChatRoom.RoomType type = ChatRoom.RoomType.valueOf(typeStr);
        Long scopeId = body.get("scopeId") != null ? Long.valueOf(body.get("scopeId").toString()) : null;
        
        List<?> rawMemberIds = (List<?>) body.get("memberIds");
        List<Long> memberIds = rawMemberIds != null
                ? rawMemberIds.stream().map(id -> Long.valueOf(id.toString())).toList()
                : java.util.Collections.emptyList();
        
        ChatRoom room = chatService.createGroupRoom(name, type, scopeId, user.getId(), memberIds);
        return ResponseEntity.ok(ApiResponse.success("Group room created", room));
    }

    @GetMapping("/rooms/{roomId}/messages")
    public ResponseEntity<ApiResponse<Page<Map<String, Object>>>> getMessages(
            @PathVariable Long roomId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            Authentication authentication) {
        Page<Map<String, Object>> messages = chatService.getRoomMessages(roomId, authentication.getName(), page, size);
        return ResponseEntity.ok(ApiResponse.success("Messages retrieved", messages));
    }

    @PostMapping("/rooms/{roomId}/messages")
    public ResponseEntity<ApiResponse<Map<String, Object>>> sendMessage(
            @PathVariable Long roomId,
            @RequestBody Map<String, Object> body,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        String content = (String) body.get("content");
        String type = (String) body.get("type");
        Long replyToId = body.get("replyToId") != null ? Long.valueOf(body.get("replyToId").toString()) : null;
        
        Map<String, Object> message = chatService.sendMessage(roomId, user.getId(), content, type, replyToId);
        return ResponseEntity.ok(ApiResponse.success("Message sent", message));
    }

    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<ApiResponse<Void>> deleteMessage(
            @PathVariable Long messageId,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        chatService.deleteMessage(messageId, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Message deleted"));
    }

    @DeleteMapping("/rooms/{roomId}")
    public ResponseEntity<ApiResponse<Void>> deleteRoom(
            @PathVariable Long roomId,
            Authentication authentication) {
        chatService.deleteRoom(roomId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Room deleted successfully"));
    }

    @GetMapping("/rooms/{roomId}/members")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMembers(
            @PathVariable Long roomId,
            Authentication authentication) {
        List<Map<String, Object>> members = chatService.getRoomMembers(roomId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Members retrieved", members));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        Map<String, Long> unread = chatService.getUnreadCount(user.getId());
        return ResponseEntity.ok(ApiResponse.success("Unread count retrieved", unread));
    }

    @PutMapping("/rooms/{roomId}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable Long roomId,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        chatService.markAsRead(roomId, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Marked as read"));
    }

    @PutMapping("/messages/{messageId}/react")
    public ResponseEntity<ApiResponse<Map<Long, String>>> toggleReaction(
            @PathVariable Long messageId,
            @RequestBody Map<String, String> body,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        String emoji = body.get("emoji");
        Map<Long, String> reactions = chatService.toggleReaction(messageId, user.getId(), emoji);
        return ResponseEntity.ok(ApiResponse.success("Reaction updated", reactions));
    }

    @GetMapping("/rooms/{roomId}/search")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> searchMessages(
            @PathVariable Long roomId,
            @RequestParam String query,
            Authentication authentication) {
        List<Map<String, Object>> results = chatService.searchMessages(roomId, query, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Search results retrieved", results));
    }

    @PostMapping("/presence/heartbeat")
    public ResponseEntity<ApiResponse<Void>> heartbeat(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        chatService.updateHeartbeat(user.getId());
        return ResponseEntity.ok(ApiResponse.success("Heartbeat registered"));
    }

    @GetMapping("/presence/online")
    public ResponseEntity<ApiResponse<Set<Long>>> getOnlineUsers() {
        Set<Long> online = chatService.getOnlineUsers();
        return ResponseEntity.ok(ApiResponse.success("Online users retrieved", online));
    }

    // ─── WebSocket Messages ──────────────────────────────────────────

    @MessageMapping("/chat/send")
    public void receiveWsMessage(@Payload Map<String, Object> body, Principal principal) {
        if (principal == null) return;
        User sender = userRepository.findByEmail(principal.getName()).orElse(null);
        if (sender == null) return;

        Long roomId = Long.valueOf(body.get("roomId").toString());
        String content = (String) body.get("content");
        String type = (String) body.get("type");
        Long replyToId = body.get("replyToId") != null ? Long.valueOf(body.get("replyToId").toString()) : null;

        chatService.sendMessage(roomId, sender.getId(), content, type, replyToId);
    }

    @MessageMapping("/chat/typing")
    public void receiveWsTyping(@Payload Map<String, Object> body, Principal principal) {
        if (principal == null) return;
        User sender = userRepository.findByEmail(principal.getName()).orElse(null);
        if (sender == null) return;

        Long roomId = Long.valueOf(body.get("roomId").toString());
        Boolean isTyping = (Boolean) body.get("isTyping");

        Map<String, Object> typingData = new LinkedHashMap<>();
        typingData.put("roomId", roomId);
        typingData.put("userId", sender.getId());
        typingData.put("userName", sender.getFullName());
        typingData.put("isTyping", isTyping);

        messagingTemplate.convertAndSend("/topic/chat/" + roomId + "/typing", typingData);
    }
}
