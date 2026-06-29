package com.therecommerce.workmap.invitation.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

/**
 * invitations 테이블 도메인 (WMP-AUTH-004, CR-027).
 * 초대 시점에 user를 만들지 않고 본 레코드만 남긴다 — 수락(인증번호+비밀번호 설정) 시점에 user 생성.
 * status: PENDING / ACCEPTED / EXPIRED / REVOKED.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Invitation {

    private Long id;
    private String email;
    private String name;
    private String role;
    private Long departmentId;
    private String status;
    private String tokenHash; // 초대 수락 토큰 해시(SHA-256). 평문은 메일 링크로만 전달(CR-027 토큰 보정).
    private Long invitedBy;
    private OffsetDateTime expiresAt;
    private OffsetDateTime acceptedAt;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
