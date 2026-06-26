package com.therecommerce.workmap.project.domain;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * projects 테이블 도메인 (T3-1, WMP-WS-002).
 * 유형은 template_id(project_template) 참조(enum 아님, BIZ-107). 생성 시 템플릿에서
 * active_tabs/workflow_id 를 복사한다. key는 work_item key 접두이며 UNIQUE.
 * visibility=PRIVATE 는 멤버만 조회 가능(BIZ-108).
 */
@Getter
@Setter
@Builder
public class Project {

    private Long id;
    private Long workspaceId;
    private String key;
    private String name;
    private Long templateId;
    private String status;
    private String visibility;
    private Long workflowId;
    private List<String> activeTabs;
    private int seqCounter;
    private LocalDate startDate;
    private LocalDate endDate;
    private String description;
    private Long createdBy;
    private OffsetDateTime archivedAt;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
