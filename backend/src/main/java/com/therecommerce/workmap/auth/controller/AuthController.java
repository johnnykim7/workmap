package com.therecommerce.workmap.auth.controller;

import com.therecommerce.common.response.ResponseDto;
import com.therecommerce.common.security.auth.AuthUserInfo;
import com.therecommerce.common.security.jwt.TokenDto;
import com.therecommerce.workmap.auth.dto.LoginRequest;
import com.therecommerce.workmap.auth.dto.LoginResponse;
import com.therecommerce.workmap.auth.dto.RefreshRequest;
import com.therecommerce.workmap.auth.service.AuthService;
import com.therecommerce.workmap.user.dto.UserResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 인증 API (T3-2 A). /auth/login, /auth/refresh 는 화이트리스트(공개),
 * /auth/me, /auth/logout 은 JWT 필요.
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

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
}
