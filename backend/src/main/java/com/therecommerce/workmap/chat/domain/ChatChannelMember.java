package com.therecommerce.workmap.chat.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

/** chat_channel_members 도메인 (CR-025). 채널 멤버십(OWNER/MEMBER). */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatChannelMember {

    private Long id;
    private Long channelId;
    private Long userId;
    private String role;   // OWNER / MEMBER
    private OffsetDateTime joinedAt;
}
