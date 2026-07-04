package com.therecommerce.workmap.workitem.domain;

import lombok.Builder;
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
public class ActivityLog {

    /** action 코드(T3-1). */
    public static final String STATUS_CHANGE = "STATUS_CHANGE";
    public static final String ASSIGN = "ASSIGN";
    public static final String FIELD_UPDATE = "FIELD_UPDATE";
    public static final String TYPE_CONVERT = "TYPE_CONVERT";
    public static final String LINK = "LINK";
    public static final String FLAG_ON = "FLAG_ON";    // 막힘 표시(CR-040)
    public static final String FLAG_OFF = "FLAG_OFF";  // 막힘 해제(CR-040)

    private Long id;
    private Long workItemId;
    private Long actorId;
    private String action;
    private String fromValue;
    private String toValue;
    private OffsetDateTime createdAt;
}
