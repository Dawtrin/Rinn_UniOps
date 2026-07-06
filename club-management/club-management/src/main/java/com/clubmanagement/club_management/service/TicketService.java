package com.clubmanagement.club_management.service;

import com.clubmanagement.club_management.entity.Event;
import com.clubmanagement.club_management.entity.EventTicket;
import com.clubmanagement.club_management.repository.EventRepository;
import com.clubmanagement.club_management.repository.EventTicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final EventTicketRepository ticketRepository;
    private final EventRepository eventRepository;
    private final EmailService emailService;
    private final AuditLogService auditLogService;

    @Transactional
    public EventTicket registerTicket(Long eventId, String fullName, String email, String phone) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Sự kiện không tồn tại"));

        if (!event.getIsPublic()) {
            throw new RuntimeException("Sự kiện này là nội bộ, không hỗ trợ đăng ký vé công khai!");
        }

        if (event.getStatus() == Event.EventStatus.COMPLETED || event.getStatus() == Event.EventStatus.CANCELLED) {
            throw new RuntimeException("Sự kiện này đã kết thúc hoặc bị hủy!");
        }

        // Check duplicate email for the same event
        if (ticketRepository.findByEventIdAndEmail(eventId, email).isPresent()) {
            throw new RuntimeException("Email này đã đăng ký vé cho sự kiện này rồi!");
        }

        String code = "TKT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase() + "-" + eventId;
        
        EventTicket ticket = EventTicket.builder()
                .event(event)
                .fullName(fullName)
                .email(email)
                .phone(phone)
                .ticketCode(code)
                .status(EventTicket.TicketStatus.REGISTERED)
                .build();

        EventTicket saved = ticketRepository.save(ticket);

        // Gửi email vé QR (trong đó QR chứa code)
        sendTicketEmail(saved);

        auditLogService.log("REGISTER_TICKET", "EventTicket", saved.getId(), "Khách " + fullName + " đăng ký vé sự kiện: " + event.getTitle());
        return saved;
    }

    @Transactional
    public EventTicket checkInTicket(String ticketCode) {
        EventTicket ticket = ticketRepository.findByTicketCode(ticketCode)
                .orElseThrow(() -> new RuntimeException("Mã vé không tồn tại trên hệ thống!"));

        if (ticket.getStatus() == EventTicket.TicketStatus.CHECKED_IN) {
            throw new RuntimeException("Vé này đã được quét check-in trước đó vào lúc: " + ticket.getCheckInTime());
        }

        ticket.setStatus(EventTicket.TicketStatus.CHECKED_IN);
        ticket.setCheckInTime(LocalDateTime.now());
        EventTicket updated = ticketRepository.save(ticket);

        auditLogService.log("CHECK_IN_TICKET", "EventTicket", updated.getId(), "Check-in vé " + ticketCode + " cho khách: " + ticket.getFullName());
        return updated;
    }

    public List<EventTicket> getTicketsByEvent(Long eventId) {
        return ticketRepository.findByEventId(eventId);
    }

    private void sendTicketEmail(EventTicket ticket) {
        String eventTitle = ticket.getEvent().getTitle();
        String eventTime = ticket.getEvent().getStartTime().toString();
        String eventLoc = ticket.getEvent().getLocation();
        
        // Mô phỏng hiển thị QR code thông qua QR API công khai (ví dụ quickchart.io hoặc qr-code-generator)
        String qrUrl = "https://quickchart.io/qr?text=" + ticket.getTicketCode() + "&size=200";

        String content = "<h3>Biên nhận đăng ký vé sự kiện thành công! 🎉</h3>" +
                "<p>Chào bạn <strong>" + ticket.getFullName() + "</strong>,</p>" +
                "<p>Cảm ơn bạn đã đăng ký tham gia sự kiện <strong>" + eventTitle + "</strong>.</p>" +
                "<p>Thông tin vé của bạn như sau:</p>" +
                "<ul>" +
                "  <li><strong>Mã vé:</strong> <code style='font-size:1.1rem;color:#4f46e5;font-weight:bold;'>" + ticket.getTicketCode() + "</code></li>" +
                "  <li><strong>Thời gian:</strong> " + eventTime + "</li>" +
                "  <li><strong>Địa điểm:</strong> " + eventLoc + "</li>" +
                "</ul>" +
                "<p>Vui lòng lưu lại hình ảnh mã QR bên dưới và trình diện tại quầy lễ tân để check-in khi vào cổng:</p>" +
                "<p style='margin: 20px 0;'><img src='" + qrUrl + "' alt='Mã QR Vé' style='border: 1px solid #ddd; padding: 10px; border-radius: 8px;'/></p>" +
                "<p>Hân hạnh được đón tiếp bạn tại sự kiện!</p>" +
                "<hr/><p style='font-size:0.8rem;color:#888;'>Hệ thống quản lý Rin UniOps</p>";
        emailService.sendHtmlEmail(ticket.getEmail(), "[Club OS] Đăng ký vé sự kiện thành công: " + eventTitle, content);
    }
}
