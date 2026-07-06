package com.clubmanagement.club_management.controller;

import com.clubmanagement.club_management.entity.SelfEvaluation;
import com.clubmanagement.club_management.entity.PaymentRecord;
import com.clubmanagement.club_management.repository.SelfEvaluationRepository;
import com.clubmanagement.club_management.repository.PaymentRecordRepository;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.awt.Color;
import java.util.List;

@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
public class PdfExportController {

    private final SelfEvaluationRepository selfEvaluationRepository;
    private final PaymentRecordRepository paymentRecordRepository;

    @GetMapping("/kpi-pdf")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<byte[]> exportKpiPdf(@RequestParam(required = false) Long userId) {
        List<SelfEvaluation> evaluations;
        if (userId != null) {
            evaluations = selfEvaluationRepository.findByUserId(userId);
        } else {
            evaluations = selfEvaluationRepository.findAll();
        }

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4);
        
        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Font configurations
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, Color.DARK_GRAY);
            Font headingFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Color.BLACK);
            Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK);

            // Title
            Paragraph title = new Paragraph("REPORT: MEMBER KPI EVALUATIONS", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            // Table
            PdfPTable table = new PdfPTable(6);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{1.5f, 1f, 2f, 1f, 1f, 1.5f});

            // Headers
            String[] headers = {"Member Name", "Month", "Self Content", "Status", "Final Score", "Grade"};
            for (String header : headers) {
                PdfPCell cell = new PdfPCell(new Paragraph(header, headingFont));
                cell.setBackgroundColor(Color.LIGHT_GRAY);
                cell.setPadding(6);
                table.addCell(cell);
            }

            // Data
            for (SelfEvaluation eval : evaluations) {
                table.addCell(new Paragraph(eval.getUser().getFullName(), bodyFont));
                table.addCell(new Paragraph(eval.getEvalMonth(), bodyFont));
                table.addCell(new Paragraph(eval.getContent() != null ? eval.getContent() : "", bodyFont));
                table.addCell(new Paragraph(eval.getStatus().name(), bodyFont));
                
                String scoreStr = "N/A";
                String gradeStr = "N/A";
                if (eval.getManagerEvaluation() != null) {
                    scoreStr = String.valueOf(eval.getManagerEvaluation().getFinalScore());
                    gradeStr = eval.getManagerEvaluation().getGrade().name();
                }
                
                table.addCell(new Paragraph(scoreStr, bodyFont));
                table.addCell(new Paragraph(gradeStr, bodyFont));
            }

            document.add(table);
            document.close();
        } catch (Exception e) {
            throw new RuntimeException("Error generating PDF: " + e.getMessage());
        }

        byte[] pdfBytes = out.toByteArray();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=kpi_report.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }

    @GetMapping("/payments-pdf")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportPaymentsPdf() {
        List<PaymentRecord> records = paymentRecordRepository.findAll();

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4);

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, Color.DARK_GRAY);
            Font headingFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Color.BLACK);
            Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK);

            Paragraph title = new Paragraph("REPORT: CLUB MEMBERSHIP FEES", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            PdfPTable table = new PdfPTable(6);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{1.5f, 1.5f, 2f, 1.2f, 1.2f, 1.5f});

            String[] headers = {"Order ID", "Member Name", "Description", "Amount", "Status", "Paid Date"};
            for (String header : headers) {
                PdfPCell cell = new PdfPCell(new Paragraph(header, headingFont));
                cell.setBackgroundColor(Color.LIGHT_GRAY);
                cell.setPadding(6);
                table.addCell(cell);
            }

            for (PaymentRecord record : records) {
                table.addCell(new Paragraph(record.getOrderId(), bodyFont));
                table.addCell(new Paragraph(record.getUser().getFullName(), bodyFont));
                table.addCell(new Paragraph(record.getOrderInfo(), bodyFont));
                table.addCell(new Paragraph(String.format("%,d VND", record.getAmount()), bodyFont));
                table.addCell(new Paragraph(record.getStatus().name(), bodyFont));
                table.addCell(new Paragraph(record.getPaidAt() != null ? record.getPaidAt().toString() : "—", bodyFont));
            }

            document.add(table);
            document.close();
        } catch (Exception e) {
            throw new RuntimeException("Error generating PDF: " + e.getMessage());
        }

        byte[] pdfBytes = out.toByteArray();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=payments_report.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }
}
