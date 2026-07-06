package com.clubmanagement.club_management.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "resource_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResourceItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ResourceType type; // FILE, LINK

    @Column(nullable = false, length = 500)
    private String url;

    @Column(name = "file_size")
    private Long fileSize;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ResourceCategory category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by")
    private User uploadedBy;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum ResourceType {
        FILE, LINK
    }

    public enum ResourceCategory {
        BYLAWS, DESIGN_ASSETS, PR_GUIDELINES, TRAINING_VIDEOS, OTHER
    }
}
