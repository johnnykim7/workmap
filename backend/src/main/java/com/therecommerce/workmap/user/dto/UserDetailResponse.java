package com.therecommerce.workmap.user.dto;

import java.time.OffsetDateTime;

/**
 * 사용자 단건 상세(프로필 카드용, CR-047 WMP-USER-001).
 * UserResponse에 departmentName(departments 조인)을 더해 카드에 부서명을 표시한다.
 * password_hash는 절대 노출하지 않는다. MyBatis가 컬럼 별칭으로 직접 매핑한다.
 */
public record UserDetailResponse(
        Long id,
        String email,
        String name,
        String role,
        Long departmentId,
        String departmentName,
        String avatarUrl,
        boolean active,
        OffsetDateTime createdAt
) {}
