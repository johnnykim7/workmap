package com.therecommerce.workmap.invitation.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

/**
 * email_otp 테이블 도메인 (POL-013, CR-027).
 * 초대/분실재설정/변경의 본인확인 인증번호를 단일 테이블로 통일. 인증번호 평문 미저장(code_hash).
 * purpose: INVITE / RESET / CHANGE.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailOtp {

    private Long id;
    private String email;
    private String purpose;
    private String codeHash;
    private Long userId;
    private int attemptCount;
    private OffsetDateTime consumedAt;
    private OffsetDateTime expiresAt;
    private OffsetDateTime createdAt;
}
