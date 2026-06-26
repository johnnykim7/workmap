package com.therecommerce.workmap.notification.mapper;

import com.therecommerce.workmap.notification.domain.Notification;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface NotificationMapper {

    void insert(Notification notification);

    /** 수신자 기준 알림 목록(읽음 필터 선택). 최신순(created_at DESC). */
    List<Notification> findByRecipient(@Param("recipientId") Long recipientId,
                                       @Param("isRead") Boolean isRead,
                                       @Param("limit") int limit,
                                       @Param("offset") int offset);

    /** 수신자 기준 알림 총 개수(읽음 필터 선택). */
    long countByRecipient(@Param("recipientId") Long recipientId,
                          @Param("isRead") Boolean isRead);

    Notification findById(@Param("id") Long id);

    /** 읽음 처리(WMP-NOTI-001). 수신자 본인 알림만 갱신되도록 recipientId 조건 동봉. */
    int markRead(@Param("id") Long id, @Param("recipientId") Long recipientId);

    /** 안 읽은 알림 개수(받은함 배지). */
    long countUnread(@Param("recipientId") Long recipientId);
}
