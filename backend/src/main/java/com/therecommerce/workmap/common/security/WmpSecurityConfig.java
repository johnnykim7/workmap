package com.therecommerce.workmap.common.security;

import com.therecommerce.common.security.BaseSecurityConfig;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
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
public class WmpSecurityConfig extends BaseSecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        applyCommonConfig(http);
        customizeFilterChain(http);
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
