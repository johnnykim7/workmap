package com.therecommerce.workmap.common.security;

import com.therecommerce.common.security.BaseSecurityConfig;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

/**
 * WorkMap Security 설정. bp-common-lib {@link BaseSecurityConfig}의 공통 구성
 * (CSRF off / STATELESS / CORS / JWT 필터 / 화이트리스트)을 적용한다.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class WmpSecurityConfig extends BaseSecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        applyCommonConfig(http);
        customizeFilterChain(http);
        // X-Frame-Options 기본값 DENY → SAMEORIGIN(CR-037). PDF 첨부 미리보기를 같은 오리진
        // iframe(/files/serve/*)에서 렌더하려면 DENY면 브라우저가 프레임을 차단한다.
        // SAMEORIGIN이라 외부 사이트의 clickjacking은 여전히 막는다.
        http.headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()));
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
