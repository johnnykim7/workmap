package com.therecommerce.workmap.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

import java.time.Clock;

/**
 * 공통 빈. Clock은 시간 의존 로직(completed_at, status_changed_at, 측정 갱신 시각)을
 * 테스트에서 Mock하기 위해 주입한다(T3-5 Clock Mock 전략).
 * @EnableAsync — 알림 유발 이벤트의 AFTER_COMMIT 비동기 리스너(@Async) 활성화(T1-6).
 */
@Configuration
@EnableAsync
public class AppConfig {

    @Bean
    public Clock clock() {
        return Clock.systemDefaultZone();
    }
}
