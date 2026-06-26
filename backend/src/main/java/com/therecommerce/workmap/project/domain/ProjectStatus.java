package com.therecommerce.workmap.project.domain;

import java.util.Map;
import java.util.Set;

/**
 * 프로젝트 상태 FSM (T1-5). 화이트리스트 전이만 허용:
 * PLANNING→ACTIVE / ACTIVE→{DONE,ARCHIVED} / DONE→ARCHIVED / ARCHIVED→ACTIVE.
 * (PLANNING→ARCHIVED 거부 — PRJ-4 / ARCHIVED→ACTIVE 허용 — PRJ-5)
 */
public enum ProjectStatus {
    PLANNING,
    ACTIVE,
    DONE,
    ARCHIVED;

    private static final Map<ProjectStatus, Set<ProjectStatus>> ALLOWED = Map.of(
            PLANNING, Set.of(ACTIVE),
            ACTIVE,   Set.of(DONE, ARCHIVED),
            DONE,     Set.of(ARCHIVED),
            ARCHIVED, Set.of(ACTIVE)
    );

    public boolean canTransitionTo(ProjectStatus target) {
        return ALLOWED.getOrDefault(this, Set.of()).contains(target);
    }
}
