package com.clubmanagement.club_management.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private String avatarUrl;
    private String role;
    private String departmentName;
    private Long departmentId;
    private Integer xp;
    private Integer level;
}
