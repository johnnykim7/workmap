package com.therecommerce.workmap.user.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;

/**
 * users 테이블 도메인 (T3-1). 로그인 ID는 email(UNIQUE), 비밀번호는 bcrypt 해시.
 * role은 전역 기본 역할(POL-004 UserRole). is_active=false 가 소프트 삭제(비활성화).
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    private Long id;
    private String email;
    private String passwordHash;
    private String name;
    private String role;
    private Long departmentId;
    private String avatarUrl;
    private boolean isActive;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
