package com.therecommerce.workmap.test;

import com.therecommerce.common.security.auth.AuthUserArgumentResolver;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;

/**
 * @WebMvcTest 슬라이스에서 @PreAuthorize 활성화 + @AuthUser/@AuthUserInfo 리졸버 등록.
 * (운영에선 WmpSecurityConfig + CommonLibAutoConfiguration이 담당)
 */
@TestConfiguration
@EnableMethodSecurity
public class MethodSecurityTestConfig {

    @Bean
    public WebMvcConfigurer authUserResolverConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
                resolvers.add(new AuthUserArgumentResolver());
            }
        };
    }
}
