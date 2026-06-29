package com.therecommerce.workmap.invitation.domain;

/**
 * 인증번호(OTP) 용도(POL-013-B, CR-027 토큰 보정). 인증번호는 이제 **비밀번호 변경(CHANGE)** 전용.
 * 초대(INVITE)·분실재설정(RESET)은 토큰 링크 방식으로 전환됨(OtpPurpose 아님 — TokenService 경유).
 */
public enum OtpPurpose {
    CHANGE("WMP_CHANGE_OTP");

    private final String templateCode;

    OtpPurpose(String templateCode) {
        this.templateCode = templateCode;
    }

    public String templateCode() {
        return templateCode;
    }
}
