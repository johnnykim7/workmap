package com.therecommerce.workmap.notification.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.notification.domain.NotificationPreference;
import com.therecommerce.workmap.notification.domain.NotificationType;
import com.therecommerce.workmap.notification.dto.NotificationPreferenceDtos;
import com.therecommerce.workmap.notification.mapper.NotificationPreferenceMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 알림 수신 설정 서비스(WMP-NOTI-003, CR-028). sparse 저장 + 기본값 머지.
 * 기본값 = 인앱 ON·이메일 OFF·푸시 OFF.
 */
@Service
@RequiredArgsConstructor
public class NotificationPreferenceService {

    private final NotificationPreferenceMapper mapper;

    /**
     * 전체 알림 종류 × 현재 설정. 저장된 행을 기본값 위에 머지하여 모든 종류를 응답한다.
     * (클라이언트가 어떤 종류가 있는지 몰라도 됨.)
     */
    @Transactional(readOnly = true)
    public NotificationPreferenceDtos.ListResponse list(Long userId) {
        Map<String, NotificationPreference> saved = new LinkedHashMap<>();
        for (NotificationPreference p : mapper.findByUser(userId)) {
            saved.put(p.getType(), p);
        }
        List<NotificationPreferenceDtos.Item> items = java.util.Arrays.stream(NotificationType.values())
                .map(t -> {
                    NotificationPreference p = saved.get(t.name());
                    if (p != null) {
                        return NotificationPreferenceDtos.Item.from(p);
                    }
                    // 기본값(인앱 ON·외부 OFF)
                    return new NotificationPreferenceDtos.Item(t.name(), true, false, false);
                })
                .toList();
        return new NotificationPreferenceDtos.ListResponse(items);
    }

    /** 보낸 종류만 부분 upsert. 미지원 type은 거부(WMP-7839). */
    @Transactional
    public void update(Long userId, NotificationPreferenceDtos.UpdateRequest req) {
        for (NotificationPreferenceDtos.ItemUpdate item : req.items()) {
            if (!NotificationType.isValid(item.type())) {
                throw new BusinessException(WmpErrorCode.NOTIFICATION_PREFERENCE_INVALID_TYPE);
            }
            mapper.upsert(NotificationPreference.builder()
                    .userId(userId)
                    .type(item.type())
                    .inApp(item.inApp())
                    .email(item.email())
                    .push(item.push())
                    .build());
        }
    }
}
