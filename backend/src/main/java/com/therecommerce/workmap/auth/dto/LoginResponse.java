package com.therecommerce.workmap.auth.dto;

import com.therecommerce.workmap.user.dto.UserResponse;

/**
 * 로그인 응답: 토큰쌍 + 내 정보(AUTH-1).
 */
public record LoginResponse(
        String accessToken,
        String refreshToken,
        UserResponse user
) {
}
