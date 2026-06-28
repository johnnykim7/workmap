package com.therecommerce.workmap.notification.service;

import com.therecommerce.workmap.invitation.service.NotificationClient;
import com.therecommerce.workmap.notification.domain.NotificationType;
import com.therecommerce.workmap.user.domain.User;
import com.therecommerce.workmap.user.mapper.UserMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * BpNotificationGateway 단위테스트 (WMP-NOTI-004, CR-028):
 * 이메일 해소·미존재/빈 이메일 스킵·푸시는 userId 기반.
 */
@ExtendWith(MockitoExtension.class)
class BpNotificationGatewayTest {

    @Mock NotificationClient client;
    @Mock UserMapper userMapper;
    BpNotificationGateway gateway;

    @BeforeEach
    void setUp() {
        gateway = new BpNotificationGateway(client, userMapper);
    }

    private User user(Long id, String email, String name) {
        return User.builder().id(id).email(email).name(name).build();
    }

    @Test
    @DisplayName("이메일발송_수신자이메일해소후템플릿코드로호출")
    void 이메일_해소후발송() {
        when(userMapper.findById(5L)).thenReturn(user(5L, "u@b.com", "홍길동"));

        gateway.sendEmail(5L, NotificationType.ASSIGNED, Map.of("title", "T"));

        verify(client).sendEmail(eq("u@b.com"), eq("WMP_NOTI_ASSIGNED"), anyMap());
    }

    @Test
    @DisplayName("이메일없는사용자_발송스킵")
    void 이메일없음_스킵() {
        when(userMapper.findById(5L)).thenReturn(user(5L, "", "홍길동"));

        gateway.sendEmail(5L, NotificationType.ASSIGNED, Map.of());

        verify(client, never()).sendEmail(any(), any(), any());
    }

    @Test
    @DisplayName("미존재사용자_발송스킵")
    void 미존재사용자_스킵() {
        when(userMapper.findById(99L)).thenReturn(null);

        gateway.sendEmail(99L, NotificationType.OVERDUE, Map.of());

        verify(client, never()).sendEmail(any(), any(), any());
    }

    @Test
    @DisplayName("푸시발송_userId기반템플릿코드호출")
    void 푸시_userId기반() {
        gateway.sendPush(5L, NotificationType.BLOCKED, Map.of("title", "T"));

        verify(client).sendPush(eq(5L), eq("WMP_NOTI_BLOCKED"), anyMap());
    }
}
