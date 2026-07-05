package com.therecommerce.workmap.workspace.domain;

import java.util.Map;
import java.util.Set;

/**
 * 워크스페이스 상태 FSM (T1-5, CR-046). 화이트리스트 전이만 허용:
 * ACTIVE→ARCHIVED(보관) / ARCHIVED→ACTIVE(보관 해제).
 * project와 달리 PLANNING/DONE 없음 — WS는 컨테이너라 활성/보관 2상태만(BIZ-113).
 * 보관은 소프트 동결 — 하위 프로젝트·채널·멤버십을 건드리지 않는다.
 */
public enum WorkspaceStatus {
    ACTIVE,
    ARCHIVED;

    private static final Map<WorkspaceStatus, Set<WorkspaceStatus>> ALLOWED = Map.of(
            ACTIVE,   Set.of(ARCHIVED),
            ARCHIVED, Set.of(ACTIVE)
    );

    public boolean canTransitionTo(WorkspaceStatus target) {
        return ALLOWED.getOrDefault(this, Set.of()).contains(target);
    }
}
