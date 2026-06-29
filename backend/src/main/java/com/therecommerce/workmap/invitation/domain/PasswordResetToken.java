package com.therecommerce.workmap.invitation.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

/**
 * password_reset_tokens 테이블 도메인 (WMP-AUTH-007, POL-013-A, CR-027 토큰 보정).
 * 분실 재설정 링크 토큰. 평문 미저장(token_hash). 짧은 만료(30분), 1회용.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PasswordResetToken {

    private Long id;
    private Long userId;
    private String tokenHash;
    private OffsetDateTime consumedAt;
    private OffsetDateTime expiresAt;
    private OffsetDateTime createdAt;
}
