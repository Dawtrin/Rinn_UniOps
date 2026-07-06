package com.clubmanagement.club_management.controller;

import com.clubmanagement.club_management.dto.response.ApiResponse;
import com.clubmanagement.club_management.entity.ResourceItem;
import com.clubmanagement.club_management.service.ResourceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceService resourceService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'MEMBER')")
    public ResponseEntity<ApiResponse<List<ResourceItem>>> getAllResources() {
        return ResponseEntity.ok(ApiResponse.success("Tải thư viện tài liệu thành công", resourceService.getAllResources()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<ResourceItem>> createResource(
            @RequestBody Map<String, Object> body,
            Authentication authentication) {
        
        String name = (String) body.get("name");
        String description = (String) body.get("description");
        String type = (String) body.get("type");
        String url = (String) body.get("url");
        Long fileSize = body.get("fileSize") != null ? ((Number) body.get("fileSize")).longValue() : null;
        String category = (String) body.get("category");

        ResourceItem item = resourceService.createResource(
                name, description, type, url, fileSize, category, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Đã thêm tài liệu mới thành công", item));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deleteResource(@PathVariable Long id) {
        resourceService.deleteResource(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa tài liệu khỏi thư viện"));
    }
}
