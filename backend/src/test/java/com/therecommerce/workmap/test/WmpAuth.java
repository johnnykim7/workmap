package com.therecommerce.workmap.test;

import com.therecommerce.workmap.common.security.WmpUserPrincipal;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.util.List;

/**
 * 테스트용 인증 헬퍼 — SecurityContext에 WmpUserPrincipal을 심어
 * @AuthUserInfo("userId") 리졸버와 @PreAuthorize(ROLE_*) 가 함께 동작하게 한다.
 */
public final class WmpAuth {

    private WmpAuth() {}

    public static RequestPostProcessor user(long userId, String role) {
        WmpUserPrincipal principal = new WmpUserPrincipal();
        principal.setUserId(userId);
        principal.setUsername("user-" + userId);
        principal.setRole(role);
        var auth = new UsernamePasswordAuthenticationToken(
                principal, null, List.of(new SimpleGrantedAuthority("ROLE_" + role)));
        return request -> {
            request.setUserPrincipal(auth);
            org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(auth);
            return request;
        };
    }
}
