package com.clubmanagement.club_management.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Async
    public void sendHtmlEmail(String to, String subject, String htmlContent) {
        if (!mailEnabled || "your-email@gmail.com".equalsIgnoreCase(mailUsername) || mailUsername.isEmpty()) {
            log.warn("Email sending is disabled or mail username is placeholder. Skipping sending email to {} with subject '{}'", to, subject);
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom("no-reply@rinuniops.com", "Rin UniOps");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            
            mailSender.send(message);
            log.info("Email sent successfully to {}", to);
        } catch (MessagingException | UnsupportedEncodingException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }
}
