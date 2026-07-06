package com.clubmanagement.club_management.service;

import com.clubmanagement.club_management.entity.AuditLog;
import com.clubmanagement.club_management.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public void log(String action, String entityName, Long entityId, String username, String details) {
        AuditLog auditLog = AuditLog.builder()
                .action(action)
                .entityName(entityName)
                .entityId(entityId)
                .username(username != null ? username : "SYSTEM")
                .details(details)
                .build();
        auditLogRepository.save(auditLog);
    }

    @Transactional
    public void log(String action, String entityName, Long entityId, String details) {
        String username = "SYSTEM";
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !(auth instanceof AnonymousAuthenticationToken)) {
            username = auth.getName();
        }
        log(action, entityName, entityId, username, details);
    }

    @Transactional(readOnly = true)
    public Page<AuditLog> getLogs(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return auditLogRepository.findAllByOrderByCreatedAtDesc(pageable);
    }
}
