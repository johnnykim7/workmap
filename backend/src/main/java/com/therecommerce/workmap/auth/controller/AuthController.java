package com.therecommerce.workmap.auth.controller;

import com.therecommerce.common.response.ResponseDto;
import com.therecommerce.common.security.auth.AuthUserInfo;
import com.therecommerce.common.security.jwt.TokenDto;
import com.therecommerce.workmap.auth.dto.LoginRequest;
import com.therecommerce.workmap.auth.dto.LoginResponse;
import com.therecommerce.workmap.auth.dto.RefreshRequest;
import com.therecommerce.workmap.auth.service.AuthService;
import com.therecommerce.workmap.invitation.dto.InvitationDtos.AcceptRequest;
import com.therecommerce.workmap.invitation.dto.InvitationDtos.ChangeRequest;
import com.therecommerce.workmap.invitation.dto.InvitationDtos.ForgotRequest;
import com.therecommerce.workmap.invitation.dto.InvitationDtos.InvitationPreview;
import com.therecommerce.workmap.invitation.dto.InvitationDtos.ResetRequest;
import com.therecommerce.workmap.invitation.service.InvitationService;
import com.therecommerce.workmap.invitation.service.PasswordService;
import com.therecommerce.workmap.user.dto.UserResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 인증 API (T3-2 A). /auth/login, /auth/refresh, /auth/invitations/accept,
 * /auth/password/forgot, /auth/password/reset 은 화이트리스트(공개).
 * /auth/me, /auth/logout, /auth/password/change* 는 JWT 필요.
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final InvitationService invitationService;
    private final PasswordService passwordService;

    @PostMapping("/login")
    public ResponseDto<LoginResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseDto.success(authService.login(req));
    }

    @PostMapping("/refresh")
    public ResponseDto<TokenDto> refresh(@Valid @RequestBody RefreshRequest req) {
        return ResponseDto.success(authService.refresh(req.refreshToken()));
    }

    @PostMapping("/logout")
    public ResponseDto<Void> logout() {
        // Phase1 stateless: 서버 토큰 무효화 저장소 없음 — 클라가 토큰 폐기. 후크 자리.
        return ResponseDto.success(null);
    }

    @GetMapping("/me")
    public ResponseDto<UserResponse> me(@AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(authService.me(userId));
    }

    // --- CR-027(토큰 보정): 초대 수락 / 비밀번호 재설정·변경 ---

    /** 초대 수락 화면 진입 미리보기(공개, WMP-AUTH-006). 토큰으로 이메일·이름·역할 표시. 무효/만료 시 410. */
    @GetMapping("/invitations/{token}")
    public ResponseDto<InvitationPreview> previewInvitation(@PathVariable String token) {
        return ResponseDto.success(invitationService.preview(token));
    }

    /** 초대 수락(공개, WMP-AUTH-006). 토큰+비밀번호 설정 → user 생성 + 자동 로그인. */
    @PostMapping("/invitations/accept")
    public ResponseDto<LoginResponse> acceptInvitation(@Valid @RequestBody AcceptRequest req) {
        return ResponseDto.success(invitationService.accept(req));
    }

    /** 분실 재설정 요청(공개, WMP-AUTH-007). 재설정 링크 발송. 계정 열거 방지 — 항상 성공 응답. */
    @PostMapping("/password/forgot")
    public ResponseDto<Void> forgotPassword(@Valid @RequestBody ForgotRequest req) {
        passwordService.requestForgot(req.email());
        return ResponseDto.success(null);
    }

    /** 재설정 완료(공개, WMP-AUTH-007). 토큰 검증 + 새 비밀번호. */
    @PostMapping("/password/reset")
    public ResponseDto<Void> resetPassword(@Valid @RequestBody ResetRequest req) {
        passwordService.reset(req);
        return ResponseDto.success(null);
    }

    /** 변경 1단계(인증, WMP-AUTH-008). 본인 이메일로 인증번호 발송. */
    @PostMapping("/password/change/request-otp")
    public ResponseDto<Void> requestChangeOtp(@AuthUserInfo("userId") Long userId) {
        passwordService.requestChangeOtp(userId);
        return ResponseDto.success(null);
    }

    /** 변경 2단계(인증, WMP-AUTH-008). 현재 PW + 인증번호 2차 인증 후 새 비밀번호. */
    @PostMapping("/password/change")
    public ResponseDto<Void> changePassword(@AuthUserInfo("userId") Long userId,
                                            @Valid @RequestBody ChangeRequest req) {
        passwordService.change(userId, req);
        return ResponseDto.success(null);
    }
}
