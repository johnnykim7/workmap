package com.therecommerce.workmap.auth.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Access Token 갱신 요청 (AUTH-4). 유효 Refresh 토큰으로 새 토큰쌍 발급.
 */
public record RefreshRequest(
        @NotBlank String refreshToken
) {
}
