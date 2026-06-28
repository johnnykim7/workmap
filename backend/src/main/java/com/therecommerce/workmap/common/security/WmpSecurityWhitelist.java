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
                // CR-027: 초대 수락·비밀번호 분실 재설정은 로그인 못 하는 사용자가 쓰므로 공개.
                // 변경(/auth/password/change*)은 로그인 필요라 화이트리스트에 넣지 않는다.
                "/api/v1/auth/invitations/accept",
                "/api/v1/auth/password/forgot",
                "/api/v1/auth/password/reset",
                // 업로드 파일 정적 서빙(CR-024). <img src>는 인증 헤더가 없으므로 GET 서빙 경로만 공개.
                // 서빙은 /files/serve/{name}으로 분리 — 업로드(/files/upload)와 패턴이 안 겹쳐 인증 유지.
                "/api/v1/files/serve/*",
                "/actuator/health",
                "/actuator/health/**"
        };
    }
}
