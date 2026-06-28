package com.therecommerce.workmap.notification.service;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 외부 알림 게이트웨이 빈 등록(CR-028). 실제 bp-notification 어댑터가 {@link NotificationGateway}
 * 빈을 제공하지 않을 때만(=현재 (B) 단계 미배선) {@link NoopNotificationGateway}로 대체한다.
 */
@Configuration
public class NotificationGatewayConfig {

    @Bean
    @ConditionalOnMissingBean(NotificationGateway.class)
    public NotificationGateway noopNotificationGateway() {
        return new NoopNotificationGateway();
    }
}
