package com.therecommerce.workmap.chat.service;

/**
 * MyBatis resultType="map" 행의 스칼라 값 타입 안전 추출 유틸 (CR-025).
 * PostgreSQL JDBC는 BIGINT→Long, INT→Integer, TIMESTAMPTZ→OffsetDateTime 로 매핑.
 */
final class ChatRowUtil {

    private ChatRowUtil() {}

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
