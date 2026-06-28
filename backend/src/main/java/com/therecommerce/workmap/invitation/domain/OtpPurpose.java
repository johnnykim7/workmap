package com.therecommerce.workmap.invitation.domain;

/**
 * 인증번호 용도(POL-013, CR-027). bp-notification 템플릿 코드와 1:1 매핑.
 */
public enum OtpPurpose {
    INVITE("WMP_INVITE_OTP"),
    RESET("WMP_RESET_OTP"),
    CHANGE("WMP_CHANGE_OTP");

    private final String templateCode;

    OtpPurpose(String templateCode) {
        this.templateCode = templateCode;
    }

    public String templateCode() {
        return templateCode;
    }
}
