package com.clubmanagement.club_management.service;

import com.clubmanagement.club_management.entity.ResourceItem;
import com.clubmanagement.club_management.entity.User;
import com.clubmanagement.club_management.repository.ResourceItemRepository;
import com.clubmanagement.club_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ResourceService {

    private final ResourceItemRepository resourceRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    public List<ResourceItem> getAllResources() {
        return resourceRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<ResourceItem> getResourcesByCategory(String categoryStr) {
        ResourceItem.ResourceCategory category = ResourceItem.ResourceCategory.valueOf(categoryStr);
        return resourceRepository.findByCategory(category);
    }

    @Transactional
    public ResourceItem createResource(String name, String description, String typeStr, String url, Long fileSize, String categoryStr, String username) {
        User user = userRepository.findByEmail(username).orElse(null);
        
        ResourceItem resource = ResourceItem.builder()
                .name(name)
                .description(description)
                .type(ResourceItem.ResourceType.valueOf(typeStr))
                .url(url)
                .fileSize(fileSize)
                .category(ResourceItem.ResourceCategory.valueOf(categoryStr))
                .uploadedBy(user)
                .build();

        ResourceItem saved = resourceRepository.save(resource);
        auditLogService.log("CREATE_RESOURCE", "ResourceItem", saved.getId(), username, 
                "Tải lên tài nguyên: " + name + " (" + resource.getType().name() + ")");
        return saved;
    }

    @Transactional
    public void deleteResource(Long id) {
        ResourceItem resource = resourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resource not found"));
        resourceRepository.delete(resource);
        auditLogService.log("DELETE_RESOURCE", "ResourceItem", id, "Xóa tài nguyên: " + resource.getName());
    }
}
