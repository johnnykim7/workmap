package com.therecommerce.workmap.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * 로그인 요청 (WMP-AUTH-001). 로그인 ID = email.
 */
public record LoginRequest(
        @NotBlank @Email String email,
        @NotBlank String password
) {
}
