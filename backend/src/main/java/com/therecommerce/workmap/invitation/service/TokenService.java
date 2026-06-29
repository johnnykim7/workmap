package com.therecommerce.workmap.invitation.service;

import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

/**
 * 인증 링크 토큰 생성·해시 (POL-013-A, CR-027 토큰 보정).
 * 추측 불가 랜덤(32바이트 base64url) 평문을 메일 링크로 전달하고, DB엔 SHA-256 해시만 저장한다.
 * 토큰은 고엔트로피라 brute-force 대상이 아니므로 OTP 같은 시도횟수 제한이 불필요.
 */
@Component
public class TokenService {

    private final SecureRandom random = new SecureRandom();

    /** 평문 토큰 생성(URL-safe, 패딩 없음). 메일 링크 쿼리로만 노출. */
    public String generateRawToken() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /** 저장·조회용 SHA-256 해시(hex). 평문은 저장하지 않는다. */
    public String hash(String rawToken) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception e) {
            // SHA-256은 표준 JDK 제공 — 사실상 발생 불가.
            throw new IllegalStateException("토큰 해시 실패", e);
        }
    }
}
