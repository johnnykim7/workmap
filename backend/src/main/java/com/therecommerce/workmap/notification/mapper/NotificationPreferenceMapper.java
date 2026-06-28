package com.therecommerce.workmap.notification.mapper;

import com.therecommerce.workmap.notification.domain.NotificationPreference;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 알림 수신 설정 매퍼(WMP-NOTI-003, CR-028). sparse 저장 — 저장된 행만 조회/upsert.
 */
@Mapper
public interface NotificationPreferenceMapper {

    /** 사용자의 저장된 설정 전부(미설정 종류는 행 없음 → 서비스에서 기본값 머지). */
    List<NotificationPreference> findByUser(@Param("userId") Long userId);

    /** 특정 사용자·종류 단건(발행 시 채널 판단용). 없으면 null → 기본값. */
    NotificationPreference findByUserAndType(@Param("userId") Long userId,
                                             @Param("type") String type);

    /** 종류별 upsert(UNIQUE user_id+type 충돌 시 갱신). 부분 갱신. */
    void upsert(NotificationPreference pref);
}
