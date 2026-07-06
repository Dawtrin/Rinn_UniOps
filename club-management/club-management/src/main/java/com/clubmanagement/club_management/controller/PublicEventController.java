package com.clubmanagement.club_management.controller;

import com.clubmanagement.club_management.dto.response.ApiResponse;
import com.clubmanagement.club_management.entity.Event;
import com.clubmanagement.club_management.entity.EventTicket;
import com.clubmanagement.club_management.repository.EventRepository;
import com.clubmanagement.club_management.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PublicEventController {

    private final TicketService ticketService;
    private final EventRepository eventRepository;

    @GetMapping("/public/events")
    public ResponseEntity<ApiResponse<List<Event>>> getPublicEvents() {
        // Find events that are public
        List<Event> publicEvents = eventRepository.findByIsPublicTrue();
        return ResponseEntity.ok(ApiResponse.success("Tải danh sách sự kiện công khai thành công", publicEvents));
    }

    @GetMapping("/public/events/{id}")
    public ResponseEntity<ApiResponse<Event>> getPublicEventById(@PathVariable Long id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sự kiện không tồn tại hoặc không phải là sự kiện công khai"));
        if (!event.getIsPublic()) {
            throw new RuntimeException("Không tìm thấy thông tin sự kiện này ở chế độ công khai!");
        }
        return ResponseEntity.ok(ApiResponse.success("Tải chi tiết sự kiện thành công", event));
    }

    @PostMapping("/public/events/{id}/register")
    public ResponseEntity<ApiResponse<EventTicket>> registerGuestTicket(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        
        String fullName = body.get("fullName");
        String email = body.get("email");
        String phone = body.get("phone");

        EventTicket ticket = ticketService.registerTicket(id, fullName, email, phone);
        return ResponseEntity.ok(ApiResponse.success("Đăng ký nhận vé thành công! Mã vé và mã QR đã được gửi về email của bạn.", ticket));
    }

    @GetMapping("/events/{id}/tickets")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<EventTicket>>> getEventTickets(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Tải danh sách vé thành công", ticketService.getTicketsByEvent(id)));
    }

    @PostMapping("/events/tickets/check-in")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<EventTicket>> checkInGuestTicket(@RequestBody Map<String, String> body) {
        String ticketCode = body.get("ticketCode");
        EventTicket ticket = ticketService.checkInTicket(ticketCode);
        return ResponseEntity.ok(ApiResponse.success("Soát vé thành công! Đã check-in cho khách: " + ticket.getFullName(), ticket));
    }
}
