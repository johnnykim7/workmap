package com.therecommerce.workmap.common.config;

import com.therecommerce.workmap.common.mybatis.StringListJsonTypeHandler;
import org.mybatis.spring.boot.autoconfigure.ConfigurationCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

import java.time.Clock;
import java.util.List;

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

    /**
     * MyBatis TypeHandler 명시 등록(CR-008). {@code type-handlers-package} 자동 스캔을 쓰지 않고
     * {@link StringListJsonTypeHandler}만 {@code List} 타입 기본 핸들러로 등록한다.
     *
     * <p>자동 스캔 시 String/Long 두 리스트 핸들러가 같은 raw {@code List} 키로 등록되어 충돌(나중 등록이
     * active_tabs 등 String 리스트 컬럼을 가로채 역직렬화 500)하기 때문이다. List&lt;Long&gt;
     * (comments.mentioned_user_ids)은 매퍼 XML에서 LongListJsonTypeHandler를 명시 지정한다.
     */
    @Bean
    public ConfigurationCustomizer typeHandlerCustomizer() {
        return configuration ->
                configuration.getTypeHandlerRegistry().register(List.class, new StringListJsonTypeHandler());
    }
}
