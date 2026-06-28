package com.therecommerce.workmap.chat.service;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

/**
 * MyBatis resultType="map" 행의 스칼라 값 타입 안전 추출 유틸 (CR-026).
 * PostgreSQL JDBC는 BIGINT→Long, INT→Integer 로 매핑하나, resultType="map" 경로에서는
 * TIMESTAMPTZ를 {@link java.sql.Timestamp}로 돌려준다(도메인 매핑과 달리 OffsetDateTime
 * TypeHandler가 적용되지 않음). 따라서 시각은 {@link #asOffsetDateTime}로 변환해야 한다 —
 * {@code (OffsetDateTime) row.get(...)} 직접 캐스팅은 ClassCastException(운영 E2E 발견).
 */
final class ChatRowUtil {

    private ChatRowUtil() {}

    /** map 행의 TIMESTAMPTZ 값을 OffsetDateTime으로. Timestamp/Instant/OffsetDateTime/null 모두 처리. */
    static OffsetDateTime asOffsetDateTime(Object v) {
        if (v == null) return null;
        if (v instanceof OffsetDateTime odt) return odt;
        if (v instanceof Timestamp ts) return ts.toInstant().atOffset(ZoneOffset.UTC);
        if (v instanceof Instant i) return i.atOffset(ZoneOffset.UTC);
        throw new IllegalStateException("지원하지 않는 시각 타입: " + v.getClass());
    }

    static Long asLong(Object v) {
        if (v == null) return null;
        if (v instanceof Long l) return l;
        if (v instanceof Number n) return n.longValue();
        return Long.valueOf(v.toString());
    }

    static int asInt(Object v) {
        if (v == null) return 0;
        if (v instanceof Number n) return n.intValue();
        return Integer.parseInt(v.toString());
    }

    static String asString(Object v) {
        return v == null ? null : v.toString();
    }
}
