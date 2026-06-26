package com.therecommerce.workmap.notification.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.common.paging.PageRequest;
import com.therecommerce.common.paging.PageResponse;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.notification.domain.Notification;
import com.therecommerce.workmap.notification.dto.NotificationDtos;
import com.therecommerce.workmap.notification.mapper.NotificationMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * NotificationService 단위테스트 (WMP-NOTI-001): 목록/읽음 처리/본인 가드.
 */
@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock NotificationMapper notificationMapper;
    NotificationService service;

    @BeforeEach
    void setUp() {
        service = new NotificationService(notificationMapper);
    }

    @Test
    @DisplayName("목록조회_읽음필터_페이징반영")
    void 목록조회_페이징반영() {
        when(notificationMapper.findByRecipient(eq(10L), eq(false), eq(20), eq(0)))
                .thenReturn(List.of(
                        Notification.builder().id(1L).recipientId(10L).type("ASSIGNED")
                                .message("배정").isRead(false).build()));
        when(notificationMapper.countByRecipient(10L, false)).thenReturn(1L);

        PageResponse<NotificationDtos.Response> res =
                service.list(10L, false, new PageRequest(0, 20));

        assertThat(res.getItems()).hasSize(1);
        assertThat(res.getTotalCount()).isEqualTo(1L);
        assertThat(res.getItems().get(0).type()).isEqualTo("ASSIGNED");
    }

    @Test
    @DisplayName("읽음처리_본인알림_성공")
    void 읽음처리_본인_성공() {
        when(notificationMapper.findById(1L)).thenReturn(
                Notification.builder().id(1L).recipientId(10L).build());

        service.markRead(1L, 10L);

        verify(notificationMapper).markRead(1L, 10L);
    }

    @Test
    @DisplayName("읽음처리_타인알림_거부됨")
    void 읽음처리_타인_거부() {
        when(notificationMapper.findById(1L)).thenReturn(
                Notification.builder().id(1L).recipientId(99L).build());

        assertThatThrownBy(() -> service.markRead(1L, 10L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.NOTIFICATION_FORBIDDEN);
        verify(notificationMapper, never()).markRead(any(), any());
    }

    @Test
    @DisplayName("읽음처리_없는알림_NOT_FOUND")
    void 읽음처리_없음_거부() {
        when(notificationMapper.findById(404L)).thenReturn(null);

        assertThatThrownBy(() -> service.markRead(404L, 10L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.NOTIFICATION_NOT_FOUND);
    }
}
