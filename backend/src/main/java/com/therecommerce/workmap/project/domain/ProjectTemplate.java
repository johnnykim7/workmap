package com.therecommerce.workmap.project.domain;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * project_template 마스터 (T3-1, BIZ-107). "프로젝트 유형"의 단일 진실 소스.
 * 프로젝트 생성 시 default_tabs→active_tabs, default_workflow_id→workflow_id 를 복사한다.
 */
@Getter
@Setter
public class ProjectTemplate {

    private Long id;
    private String code;
    private String name;
    private String description;
    private String icon;
    private List<String> defaultTabs;
    private Long defaultWorkflowId;
    private List<String> issueTypeCodes;
    private boolean isSystem;
    private int sortOrder;
}
