package com.therecommerce.workmap.member.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;

/**
 * project_members 테이블 도메인 (T3-1, WMP-WS-005). 프로젝트 내 역할(POL-004) 보유.
 * 비공개 프로젝트 조회 권한·담당자/멘션 대상의 기준(BIZ-108).
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectMember {

    private Long projectId;
    private Long userId;
    private String role;
    private OffsetDateTime createdAt;
}
