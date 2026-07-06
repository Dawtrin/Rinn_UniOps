package com.clubmanagement.club_management.repository;

import com.clubmanagement.club_management.entity.EventTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventTicketRepository extends JpaRepository<EventTicket, Long> {
    List<EventTicket> findByEventId(Long eventId);
    Optional<EventTicket> findByTicketCode(String ticketCode);
    Optional<EventTicket> findByEventIdAndEmail(Long eventId, String email);
}
