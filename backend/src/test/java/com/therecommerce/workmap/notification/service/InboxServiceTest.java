package com.therecommerce.workmap.notification.service;

import com.therecommerce.common.paging.PageRequest;
import com.therecommerce.common.paging.PageResponse;
import com.therecommerce.workmap.notification.domain.Notification;
import com.therecommerce.workmap.notification.dto.InboxDtos;
import com.therecommerce.workmap.notification.dto.NotificationDtos;
import com.therecommerce.workmap.notification.mapper.NotificationMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

/**
 * InboxService 단위테스트 (WMP-NOTI-001, /inbox): 받은함은 알림 목록 + 안읽음 배지를
 * 한 번에 반환한다(CR-011). 데이터원은 NotificationService 재사용.
 */
@ExtendWith(MockitoExtension.class)
class InboxServiceTest {

    @Mock NotificationMapper notificationMapper;
    InboxService inboxService;

    @BeforeEach
    void setUp() {
        // InboxService 는 NotificationService 를 위임 — 실제 위임 검증을 위해 실 인스턴스 사용
        inboxService = new InboxService(new NotificationService(notificationMapper));
    }

    @Test
    @DisplayName("받은함_목록과_안읽음배지_함께반환")
    void 받은함_통합반환() {
        when(notificationMapper.findByRecipient(eq(10L), isNull(), eq(20), eq(0)))
                .thenReturn(List.of(
                        Notification.builder().id(1L).recipientId(10L).type("MENTIONED")
                                .message("멘션").isRead(false).build()));
        when(notificationMapper.countByRecipient(10L, null)).thenReturn(1L);
        when(notificationMapper.countUnread(10L)).thenReturn(3L);

        InboxDtos.Response res = inboxService.inbox(10L, null, new PageRequest(0, 20));

        PageResponse<NotificationDtos.Response> list = res.notifications();
        assertThat(list.getItems()).hasSize(1);
        assertThat(list.getItems().get(0).type()).isEqualTo("MENTIONED");
        assertThat(list.getTotalCount()).isEqualTo(1L);
        assertThat(res.unreadCount()).isEqualTo(3L);   // 안읽음 배지는 전체 안읽음 수
    }

    @Test
    @DisplayName("받은함_빈상태_unreadCount0")
    void 받은함_빈상태() {
        when(notificationMapper.findByRecipient(eq(20L), isNull(), eq(20), eq(0)))
                .thenReturn(List.of());
        when(notificationMapper.countByRecipient(20L, null)).thenReturn(0L);
        when(notificationMapper.countUnread(20L)).thenReturn(0L);

        InboxDtos.Response res = inboxService.inbox(20L, null, new PageRequest(0, 20));

        assertThat(res.notifications().getItems()).isEmpty();
        assertThat(res.unreadCount()).isEqualTo(0L);
    }
}
