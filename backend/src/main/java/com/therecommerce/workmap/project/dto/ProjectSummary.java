package com.therecommerce.workmap.project.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 프로젝트 홈 요약 (WMP-WS-003): 전체/완료/지연/막힘 카운트 + 진행률(%).
 * 카운트는 work_items 집계(Sprint 3 이후 채워짐). Sprint 2 단계에선 0으로 반환될 수 있다.
 */
@Getter
@Setter
public class ProjectSummary {

    private long total;
    private long done;
    private long delayed;
    private long blocked;
    private int progress;
}
