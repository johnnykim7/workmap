package com.therecommerce.workmap.notification.service;

import com.therecommerce.workmap.notification.domain.NotificationType;
import com.therecommerce.workmap.notification.mapper.NotificationMapper;
import com.therecommerce.workmap.workitem.domain.WorkItem;
import com.therecommerce.workmap.workitem.mapper.WorkItemMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.*;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * DueNotificationService 단위테스트 (WMP-NOTI-005, CR-028):
 * 임박/초과 판정·완료 제외(쿼리)·중복 방지·담당자 없음 스킵.
 * 기준일: 2026-06-29 (Clock 고정).
 */
@ExtendWith(MockitoExtension.class)
class DueNotificationServiceTest {

    @Mock WorkItemMapper workItemMapper;
    @Mock NotificationMapper notificationMapper;
    @Mock NotificationDispatcher dispatcher;
    DueNotificationService service;

    private final Clock clock = Clock.fixed(
            LocalDate.of(2026, 6, 29).atStartOfDay(ZoneOffset.UTC).toInstant(), ZoneOffset.UTC);

    @BeforeEach
    void setUp() {
        service = new DueNotificationService(workItemMapper, notificationMapper, dispatcher, clock);
        ReflectionTestUtils.setField(service, "dueSoonDays", 1);
    }

    private WorkItem item(Long id, Long assignee, LocalDate due) {
        return WorkItem.builder()
                .id(id)
                .assigneeId(assignee)
                .dueDate(due)
                .build();
    }

    @Test
    @DisplayName("마감오늘_임박알림발행")
    void 마감오늘_임박() {
        when(workItemMapper.findDueForNotification(1)).thenReturn(
                List.of(item(10L, 5L, LocalDate.of(2026, 6, 29))));
        when(notificationMapper.existsTodayByType(anyLong(), anyLong(), anyString())).thenReturn(false);

        service.notifyDueItems();

        verify(dispatcher).dispatch(eq(5L), eq(NotificationType.DUE_APPROACHING), eq(10L), anyString());
    }

    @Test
    @DisplayName("마감지남_초과알림발행")
    void 마감지남_초과() {
        when(workItemMapper.findDueForNotification(1)).thenReturn(
                List.of(item(11L, 5L, LocalDate.of(2026, 6, 27))));
        when(notificationMapper.existsTodayByType(anyLong(), anyLong(), anyString())).thenReturn(false);

        service.notifyDueItems();

        verify(dispatcher).dispatch(eq(5L), eq(NotificationType.OVERDUE), eq(11L), anyString());
    }

    @Test
    @DisplayName("오늘이미발행됨_중복방지로스킵")
    void 중복방지_스킵() {
        when(workItemMapper.findDueForNotification(1)).thenReturn(
                List.of(item(12L, 5L, LocalDate.of(2026, 6, 29))));
        when(notificationMapper.existsTodayByType(5L, 12L, "DUE_APPROACHING")).thenReturn(true);

        service.notifyDueItems();

        verify(dispatcher, never()).dispatch(any(), any(), any(), anyString());
    }

    @Test
    @DisplayName("마감여유_임박범위밖_스킵")
    void 임박범위밖_스킵() {
        // dueSoonDays=1인데 마감 3일 후 → 임박/초과 아님(쿼리 여유분이 흘러와도 서비스에서 스킵)
        when(workItemMapper.findDueForNotification(1)).thenReturn(
                List.of(item(13L, 5L, LocalDate.of(2026, 7, 2))));

        service.notifyDueItems();

        verify(dispatcher, never()).dispatch(any(), any(), any(), anyString());
    }
}
