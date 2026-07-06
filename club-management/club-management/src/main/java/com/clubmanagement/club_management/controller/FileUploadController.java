package com.clubmanagement.club_management.controller;

import com.clubmanagement.club_management.dto.response.ApiResponse;
import com.clubmanagement.club_management.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
public class FileUploadController {

    private final FileUploadService fileUploadService;

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadFile(@RequestParam("file") MultipartFile file) {
        String fileUrl = fileUploadService.storeFile(file);
        
        Map<String, String> data = new HashMap<>();
        data.put("fileUrl", fileUrl);
        data.put("fileName", file.getOriginalFilename());
        
        return ResponseEntity.ok(ApiResponse.success("File uploaded successfully", data));
    }
}
