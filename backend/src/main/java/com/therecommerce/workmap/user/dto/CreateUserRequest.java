package com.therecommerce.workmap.user.dto;

import com.therecommerce.workmap.user.domain.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 사용자 생성/초대 요청 (WMP-AUTH-004). role 미지정 시 MEMBER.
 */
public record CreateUserRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, max = 72) String password,
        @NotBlank @Size(max = 50) String name,
        String role,
        Long departmentId
) {
    public String roleOrDefault() {
        return (role == null || role.isBlank()) ? UserRole.MEMBER.name() : role;
    }
}
