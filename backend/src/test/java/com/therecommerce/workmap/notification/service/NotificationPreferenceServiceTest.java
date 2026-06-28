package com.therecommerce.workmap.notification.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.notification.domain.NotificationPreference;
import com.therecommerce.workmap.notification.domain.NotificationType;
import com.therecommerce.workmap.notification.dto.NotificationPreferenceDtos;
import com.therecommerce.workmap.notification.mapper.NotificationPreferenceMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * NotificationPreferenceService 단위테스트 (WMP-NOTI-003, CR-028):
 * 기본값 머지·부분 upsert·미지원 type 거부.
 */
@ExtendWith(MockitoExtension.class)
class NotificationPreferenceServiceTest {

    @Mock NotificationPreferenceMapper mapper;
    NotificationPreferenceService service;

    @BeforeEach
    void setUp() {
        service = new NotificationPreferenceService(mapper);
    }

    @Test
    @DisplayName("저장없음_전종류기본값으로응답")
    void 기본값머지() {
        when(mapper.findByUser(1L)).thenReturn(List.of());

        NotificationPreferenceDtos.ListResponse res = service.list(1L);

        // 전체 종류가 다 응답되고, 기본값(인앱 ON·외부 OFF)
        assertThat(res.items()).hasSize(NotificationType.values().length);
        assertThat(res.items()).allMatch(i -> i.inApp() && !i.email() && !i.push());
    }

    @Test
    @DisplayName("일부저장됨_저장값우선_나머지기본값")
    void 저장값머지() {
        NotificationPreference saved = NotificationPreference.builder()
                .userId(1L).type("ASSIGNED").inApp(true).email(true).push(false).build();
        when(mapper.findByUser(1L)).thenReturn(List.of(saved));

        NotificationPreferenceDtos.ListResponse res = service.list(1L);

        NotificationPreferenceDtos.Item assigned = res.items().stream()
                .filter(i -> i.type().equals("ASSIGNED")).findFirst().orElseThrow();
        assertThat(assigned.email()).isTrue();   // 저장값 반영
    }

    @Test
    @DisplayName("부분갱신_보낸종류만upsert")
    void 부분upsert() {
        var req = new NotificationPreferenceDtos.UpdateRequest(List.of(
                new NotificationPreferenceDtos.ItemUpdate("ASSIGNED", true, true, false),
                new NotificationPreferenceDtos.ItemUpdate("OVERDUE", true, false, true)));

        service.update(1L, req);

        verify(mapper, times(2)).upsert(any());
    }

    @Test
    @DisplayName("미지원type_거부됨")
    void 미지원type_거부() {
        var req = new NotificationPreferenceDtos.UpdateRequest(List.of(
                new NotificationPreferenceDtos.ItemUpdate("NOT_A_TYPE", true, false, false)));

        assertThatThrownBy(() -> service.update(1L, req))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.NOTIFICATION_PREFERENCE_INVALID_TYPE);
        verify(mapper, never()).upsert(any());
    }
}
