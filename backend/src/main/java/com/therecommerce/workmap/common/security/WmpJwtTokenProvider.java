package com.therecommerce.workmap.common.security;

import com.therecommerce.common.config.JwtProperties;
import com.therecommerce.common.security.BaseUserPrincipal;
import com.therecommerce.common.security.jwt.JwtTokenProvider;
import io.jsonwebtoken.Claims;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * WorkMap JWT 발급/파싱. bp-common-lib {@link JwtTokenProvider} 상속.
 * 추가 클레임: deptId(부서). userId/role은 상위에서 기본 처리.
 */
@Component
public class WmpJwtTokenProvider extends JwtTokenProvider {

    public WmpJwtTokenProvider(JwtProperties props) {
        super(props.getSecret(), props.getAccessExpiration(), props.getRefreshExpiration());
    }

    @Override
    protected Map<String, Object> getAdditionalClaims(BaseUserPrincipal principal) {
        Map<String, Object> claims = new HashMap<>();
        if (principal instanceof WmpUserPrincipal wmp && wmp.getDepartmentId() != null) {
            claims.put("deptId", wmp.getDepartmentId());
        }
        return claims;
    }

    @Override
    protected BaseUserPrincipal parsePrincipal(Claims claims) {
        WmpUserPrincipal principal = new WmpUserPrincipal();
        Object userId = claims.get("userId");
        if (userId != null) {
            principal.setUserId(Long.valueOf(userId.toString()));
        }
        principal.setUsername(claims.getSubject());
        principal.setRole(claims.get("role", String.class));
        Object deptId = claims.get("deptId");
        if (deptId != null) {
            principal.setDepartmentId(Long.valueOf(deptId.toString()));
        }
        return principal;
    }
}
