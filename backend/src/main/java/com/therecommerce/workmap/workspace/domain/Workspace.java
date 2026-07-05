package com.therecommerce.workmap.workspace.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;

/**
 * workspaces 테이블 도메인 (T3-1, WMP-WS-001). 회사/큰 업무 공간. 하위에 projects를 가진다.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Workspace {

    private Long id;
    private String name;
    private String description;
    /** ACTIVE / ARCHIVED (workspace FSM, T1-5). 보관은 소프트 동결(BIZ-113, CR-046). */
    private String status;
    /** 보관 시점. 해제 시 null 복원. status=ARCHIVED와 정합. */
    private OffsetDateTime archivedAt;
    private Long createdBy;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
