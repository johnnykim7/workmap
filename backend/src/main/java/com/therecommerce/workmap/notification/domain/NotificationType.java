package com.therecommerce.workmap.notification.domain;

/**
 * 알림 종류(WMP-NOTI-002, CR-028 확장). notifications.type / notification_preferences.type 도메인.
 *
 * <p>DB 컬럼은 {@code VARCHAR(40)}이라 enum 추가에 스키마 변경이 없다(T3-1). 발행 코드와
 * 수신 설정 매트릭스는 본 enum을 단일 출처로 사용한다.
 *
 * <p>기존(배정/멘션/막힘/마감) + CR-028 신규(댓글/상태변경/스프린트/승인).
 */
public enum NotificationType {

    ASSIGNED,            // 업무 배정 (기존)
    MENTIONED,           // 댓글 @멘션 (기존)
    BLOCKED,             // BLOCKED 전이 (기존)
    DUE_APPROACHING,     // 마감 임박 — 스케줄러 (CR-028 발행)
    OVERDUE,             // 마감 초과 — 스케줄러 (CR-028 발행)
    COMMENTED,           // 일반 댓글(멘션 아님) → 담당자 (CR-028)
    STATUS_CHANGED,      // 상태 전이 → 담당자 (CR-028)
    SPRINT_STARTED,      // 스프린트 시작 → 프로젝트 멤버 (CR-028)
    SPRINT_COMPLETED,    // 스프린트 완료 → 프로젝트 멤버 (CR-028)
    APPROVAL_REQUESTED,  // 승인 게이트 진입 → 승인자 (CR-028)
    APPROVAL_DECIDED;    // 승인/거부 처리 → 요청자 (CR-028)

    /** 문자열이 유효한 종류인지(수신 설정 입력 검증용). */
    public static boolean isValid(String value) {
        if (value == null) {
            return false;
        }
        for (NotificationType t : values()) {
            if (t.name().equals(value)) {
                return true;
            }
        }
        return false;
    }
}
