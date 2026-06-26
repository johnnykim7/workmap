package com.therecommerce.workmap.user.dto;

import jakarta.validation.constraints.Size;

/**
 * 사용자 수정 요청 (역할·부서·이름). 비밀번호/이메일 변경은 별도 흐름.
 */
public record UpdateUserRequest(
        @Size(max = 50) String name,
        String role,
        Long departmentId
) {
}
