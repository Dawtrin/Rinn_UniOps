package com.clubmanagement.club_management.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "available_quantity", nullable = false)
    private Integer availableQuantity;

    @Column(length = 150)
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ItemCondition itemCondition = ItemCondition.GOOD;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (availableQuantity == null) {
            availableQuantity = quantity;
        }
    }

    public enum ItemCondition {
        GOOD, DAMAGED, REPAIRING
    }
}
