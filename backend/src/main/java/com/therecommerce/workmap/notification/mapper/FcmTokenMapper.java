package com.therecommerce.workmap.notification.mapper;

import com.therecommerce.workmap.notification.domain.FcmToken;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * FCM 기기 토큰 매퍼(WMP-NOTI-004, CR-028). 푸시 전달 대상 토큰 조회/등록/삭제.
 */
@Mapper
public interface FcmTokenMapper {

    /** 사용자의 등록 토큰 전부(다기기). 푸시 발행 시 대상. */
    List<FcmToken> findByUser(@Param("userId") Long userId);

    /** 등록(UNIQUE user_id+fcm_token 충돌 시 무시 — 재로그인 중복 방지). */
    void insertIgnore(FcmToken token);

    /** 로그아웃 시 토큰 삭제(본인 것만). */
    int delete(@Param("userId") Long userId, @Param("fcmToken") String fcmToken);
}
