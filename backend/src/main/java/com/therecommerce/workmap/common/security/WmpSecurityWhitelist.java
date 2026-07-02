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
                // CR-027(토큰 보정): 초대 미리보기(GET /invitations/{token})·수락·비밀번호 분실 재설정은
                // 로그인 못 하는 사용자가 쓰므로 공개. 변경(/auth/password/change*)은 로그인 필요라 제외.
                "/api/v1/auth/invitations/*",
                "/api/v1/auth/password/forgot",
                "/api/v1/auth/password/reset",
                // CR-032: 셀프 가입 요청은 로그인 못 하는 사람이 쓰므로 공개(신청만 — 승인/거절은 Admin).
                "/api/v1/auth/signup-requests",
                // 업로드 파일 정적 서빙(CR-024). <img src>는 인증 헤더가 없으므로 GET 서빙 경로만 공개.
                // 서빙은 /files/serve/{name}으로 분리 — 업로드(/files/upload)와 패턴이 안 겹쳐 인증 유지.
                "/api/v1/files/serve/*",
                "/actuator/health",
                "/actuator/health/**"
        };
    }
}
