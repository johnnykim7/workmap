package com.therecommerce.workmap.common.security;

import com.therecommerce.common.security.SecurityWhitelist;
import com.therecommerce.common.security.jwt.JwtFilter;
import org.springframework.stereotype.Component;

/**
 * WorkMap JWT 인증 필터. bp-common-lib {@link JwtFilter} 상속.
 * 검증/인증 로직은 상위에서 처리하며, 화이트리스트는 {@link WmpSecurityWhitelist} 주입.
 */
@Component
public class WmpJwtFilter extends JwtFilter {

    public WmpJwtFilter(WmpJwtTokenProvider tokenProvider, SecurityWhitelist whitelist) {
        super(tokenProvider, whitelist);
    }
}
