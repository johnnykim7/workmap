package com.therecommerce.workmap.agile.domain;

/**
 * 스프린트 FSM(T1-5, 기획서 §6.1): FUTURE → ACTIVE → COMPLETED.
 * 프로젝트당 동시 ACTIVE 1개. COMPLETED는 최종 상태(재개 불가).
 */
public enum SprintStatus {
    FUTURE,
    ACTIVE,
    COMPLETED
}
