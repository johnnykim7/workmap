package com.therecommerce.workmap.workitem.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;

/**
 * activity_logs 도메인(T3-1, WMP-WI-011). 상태변경/배정/필드수정/유형전환/링크 이력을
 * 동일 트랜잭션에서 기록한다(T1-6 활동로그 기록자 = 동일 TX).
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityLog {

    /** action 코드(T3-1). */
    public static final String STATUS_CHANGE = "STATUS_CHANGE";
    public static final String ASSIGN = "ASSIGN";
    public static final String FIELD_UPDATE = "FIELD_UPDATE";
    public static final String TYPE_CONVERT = "TYPE_CONVERT";
    public static final String LINK = "LINK";
    public static final String FLAG_ON = "FLAG_ON";    // 막힘 표시(CR-040)
    public static final String FLAG_OFF = "FLAG_OFF";  // 막힘 해제(CR-040)
    public static final String COMPLETE_WITH_UNMET = "COMPLETE_WITH_UNMET";  // 인수조건 미충족 완료(CR-049, BIZ-116)

    private Long id;
    private Long workItemId;
    private Long actorId;
    private String action;
    private String fromValue;
    private String toValue;
    private String metadata;    // 구조화 부가정보 JSONB(CR-049) — COMPLETE_WITH_UNMET 미충족 스냅샷 등
    private OffsetDateTime createdAt;
}
