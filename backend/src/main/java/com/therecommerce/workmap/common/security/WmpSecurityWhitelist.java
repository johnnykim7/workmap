package com.therecommerce.workmap.common.security;

import com.therecommerce.common.security.SecurityWhitelist;
import org.springframework.stereotype.Component;

/**
 * WorkMap 공개 경로(인증 불필요). bp-common-lib {@link SecurityWhitelist} 구현.
 */
@Component
public class WmpSecurityWhitelist implements SecurityWhitelist {

    @Override
    public String[] getWhitelistPatterns() {
        return new String[]{
                "/api/v1/auth/login",
                "/api/v1/auth/refresh",
                "/actuator/health",
                "/actuator/health/**"
        };
    }
}
