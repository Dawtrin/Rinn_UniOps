package com.clubmanagement.club_management.controller;

import com.clubmanagement.club_management.dto.response.ApiResponse;
import com.clubmanagement.club_management.entity.Department;
import com.clubmanagement.club_management.service.DepartmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentService departmentService;
    private final com.clubmanagement.club_management.service.UserService userService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Department>>> getAllDepartments() {
        return ResponseEntity.ok(ApiResponse.success("Departments retrieved successfully", departmentService.getAllDepartments()));
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<ApiResponse<List<com.clubmanagement.club_management.dto.response.UserResponse>>> getDepartmentMembers(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Members retrieved", userService.getDepartmentMembers(id)));
    }
}
