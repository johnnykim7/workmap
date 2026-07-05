package com.therecommerce.workmap.user.dto;

import jakarta.validation.constraints.Size;

/**
 * 본인 프로필 사진 URL 저장 요청 (CR-047 WMP-USER-001).
 * avatarUrl은 POST /files/upload 결과 URL(/files/serve/*). null이면 사진 제거.
 */
public record UpdateAvatarRequest(
        @Size(max = 500) String avatarUrl
) {
}
