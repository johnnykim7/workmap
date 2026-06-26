package com.therecommerce.workmap.workspace.domain;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;

/**
 * workspaces 테이블 도메인 (T3-1, WMP-WS-001). 회사/큰 업무 공간. 하위에 projects를 가진다.
 */
@Getter
@Setter
@Builder
public class Workspace {

    private Long id;
    private String name;
    private String description;
    private Long createdBy;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
