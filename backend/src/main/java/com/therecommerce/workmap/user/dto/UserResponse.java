package com.therecommerce.workmap.user.dto;

import com.therecommerce.workmap.user.domain.User;

import java.time.OffsetDateTime;

/**
 * 사용자 응답 DTO. password_hash는 절대 노출하지 않는다.
 */
public record UserResponse(
        Long id,
        String email,
        String name,
        String role,
        Long departmentId,
        boolean active,
        OffsetDateTime createdAt
) {
    public static UserResponse from(User u) {
        return new UserResponse(
                u.getId(), u.getEmail(), u.getName(), u.getRole(),
                u.getDepartmentId(), u.isActive(), u.getCreatedAt());
    }
}
