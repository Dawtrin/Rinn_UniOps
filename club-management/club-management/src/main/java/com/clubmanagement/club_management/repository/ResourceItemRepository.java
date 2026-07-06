package com.clubmanagement.club_management.repository;

import com.clubmanagement.club_management.entity.ResourceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResourceItemRepository extends JpaRepository<ResourceItem, Long> {
    List<ResourceItem> findByCategory(ResourceItem.ResourceCategory category);
    List<ResourceItem> findAllByOrderByCreatedAtDesc();
}
