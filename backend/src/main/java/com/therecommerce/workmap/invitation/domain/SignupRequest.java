package com.therecommerce.workmap.invitation.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

/**
 * signup_requests 테이블 도메인 (WMP-AUTH-010, CR-032).
 * 셀프 가입 신청 — user 미생성. 승인 시 invitations로 이관. status: PENDING/APPROVED/REJECTED.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SignupRequest {

    private Long id;
    private String email;
    private String name;
    private String reason;
    private String status;
    private Long processedBy;
    private String rejectReason;
    private OffsetDateTime processedAt;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
