package com.therecommerce.workmap.notification.service;

import com.therecommerce.workmap.notification.domain.NotificationPreference;
import com.therecommerce.workmap.notification.domain.NotificationType;
import com.therecommerce.workmap.notification.mapper.NotificationMapper;
import com.therecommerce.workmap.notification.mapper.NotificationPreferenceMapper;
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
 * NotificationDispatcher 단위테스트 (CR-028): 인앱 항상 기록 + 설정 기반 외부 fan-out.
 */
@ExtendWith(MockitoExtension.class)
class NotificationDispatcherTest {

    @Mock NotificationMapper notificationMapper;
    @Mock NotificationPreferenceMapper preferenceMapper;
    @Mock NotificationGateway gateway;
    NotificationDispatcher dispatcher;

    @BeforeEach
    void setUp() {
        dispatcher = new NotificationDispatcher(notificationMapper, preferenceMapper, gateway);
    }

    @Test
    @DisplayName("설정없음_기본값_인앱만기록하고외부전송안함")
    void 설정없음_기본값_인앱만() {
        when(preferenceMapper.findByUserAndType(1L, "ASSIGNED")).thenReturn(null);

        dispatcher.dispatch(1L, NotificationType.ASSIGNED, 100L, "배정");

        verify(notificationMapper).insert(any());           // 인앱 항상
        verify(gateway, never()).sendEmail(any(), any(), any());
        verify(gateway, never()).sendPush(any(), any(), any());
    }

    @Test
    @DisplayName("이메일ON_인앱기록과이메일전송_푸시는안함")
    void 이메일ON_이메일만외부() {
        NotificationPreference pref = NotificationPreference.builder()
                .userId(1L).type("ASSIGNED").inApp(true).email(true).push(false).build();
        when(preferenceMapper.findByUserAndType(1L, "ASSIGNED")).thenReturn(pref);

        dispatcher.dispatch(1L, NotificationType.ASSIGNED, 100L, "배정", Map.of("title", "T"));

        verify(notificationMapper).insert(any());
        verify(gateway).sendEmail(eq(1L), eq(NotificationType.ASSIGNED), anyMap());
        verify(gateway, never()).sendPush(any(), any(), any());
    }

    @Test
    @DisplayName("푸시ON_푸시전송")
    void 푸시ON_푸시외부() {
        NotificationPreference pref = NotificationPreference.builder()
                .userId(1L).type("BLOCKED").inApp(true).email(false).push(true).build();
        when(preferenceMapper.findByUserAndType(1L, "BLOCKED")).thenReturn(pref);

        dispatcher.dispatch(1L, NotificationType.BLOCKED, 100L, "막힘");

        verify(gateway).sendPush(eq(1L), eq(NotificationType.BLOCKED), anyMap());
        verify(gateway, never()).sendEmail(any(), any(), any());
    }

    @Test
    @DisplayName("수신자null_아무것도안함")
    void 수신자null_스킵() {
        dispatcher.dispatch(null, NotificationType.ASSIGNED, 100L, "배정");

        verify(notificationMapper, never()).insert(any());
        verifyNoInteractions(gateway);
    }
}
