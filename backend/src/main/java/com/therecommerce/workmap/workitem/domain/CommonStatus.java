package com.therecommerce.workmap.workitem.domain;

/**
 * 집계용 공통 상태군(T1-5). 워크플로 상태 → 회사홈/보고 집계 기준으로 환산한 값.
 * work_items.common_status에 비정규화 저장(BIZ-106). BLOCKED는 횡단 상태.
 */
public enum CommonStatus {
    TODO,
    IN_PROGRESS,
    IN_REVIEW,
    DONE,
    HOLD,
    BLOCKED
}
