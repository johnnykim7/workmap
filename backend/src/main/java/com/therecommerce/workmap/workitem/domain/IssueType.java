package com.therecommerce.workmap.workitem.domain;

/**
 * 업무 항목 유형(T3-1). 시스템 기본 6종(DOC 포함). depth는 계층 정합성(BIZ-103) 판정용.
 * 마스터(issue_type)와 코드 일치 — 여기서는 계층 규칙만 코드로 둔다(유형 추가는 마스터 행, BIZ-107).
 */
public enum IssueType {
    EPIC(0),
    STORY(1),
    TASK(1),
    BUG(1),
    DOC(1),
    SUBTASK(2);

    private final int depth;

    IssueType(int depth) {
        this.depth = depth;
    }

    public int depth() {
        return depth;
    }

    /** SUBTASK는 부모 필수(BIZ-103). */
    public boolean requiresParent() {
        return this == SUBTASK;
    }

    /** Sub-task의 부모가 될 수 있는 유형 — STORY/TASK/BUG만. EPIC/DOC/SUBTASK는 불가(BIZ-103). */
    public boolean canBeSubtaskParent() {
        return this != EPIC && this != DOC && this != SUBTASK;
    }
}
