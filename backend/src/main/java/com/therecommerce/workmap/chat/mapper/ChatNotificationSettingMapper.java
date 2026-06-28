package com.therecommerce.workmap.chat.mapper;

import com.therecommerce.workmap.chat.domain.ChatNotificationSetting;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface ChatNotificationSettingMapper {

    ChatNotificationSetting findByUserAndChannel(@Param("userId") Long userId,
                                                 @Param("channelId") Long channelId);

    /** 알림 설정 upsert(user_id, channel_id UNIQUE). */
    int upsert(@Param("userId") Long userId,
               @Param("channelId") Long channelId,
               @Param("notifyLevel") String notifyLevel,
               @Param("muteUntil") java.time.OffsetDateTime muteUntil);
}
