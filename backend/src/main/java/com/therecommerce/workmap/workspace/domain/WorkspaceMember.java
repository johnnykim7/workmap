package com.therecommerce.workmap.workspace.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;

/**
 * workspace_members 테이블 도메인 (T3-1, WMP-WS-007, CR-018).
 * WS 멤버십 = 1차 격리 경계(BIZ-112). role 컬럼 없음 — WS별 Admin 안 둠(전사 Admin만).
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkspaceMember {

    private Long workspaceId;
    private Long userId;
    private OffsetDateTime createdAt;
}
