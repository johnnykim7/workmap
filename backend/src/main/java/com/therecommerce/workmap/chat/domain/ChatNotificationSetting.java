package com.therecommerce.workmap.chat.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

/** chat_notification_settings 도메인 (CR-025). 채널별 사용자별 알림 레벨/음소거. */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatNotificationSetting {

    private Long id;
    private Long userId;
    private Long channelId;
    private OffsetDateTime muteUntil;
    private String notifyLevel;   // ALL / MENTIONS_ONLY / NONE
    private OffsetDateTime updatedAt;
}
