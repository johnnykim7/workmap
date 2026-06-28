package com.therecommerce.workmap.auth.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.common.security.BaseUserPrincipal;
import com.therecommerce.common.security.jwt.TokenDto;
import com.therecommerce.workmap.auth.dto.LoginRequest;
import com.therecommerce.workmap.auth.dto.LoginResponse;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.common.security.WmpJwtTokenProvider;
import com.therecommerce.workmap.common.security.WmpUserPrincipal;
import com.therecommerce.workmap.user.domain.User;
import com.therecommerce.workmap.user.dto.UserResponse;
import com.therecommerce.workmap.user.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 인증 (WMP-AUTH-001~003).
 * 로그인: 이메일/비밀번호 검증(AUTH-2 불일치 거부) + 비활성 계정 거부(AUTH-3) → JWT 발급(AUTH-1).
 * 갱신: 유효 Refresh로 새 토큰쌍(AUTH-4).
 * 로그아웃은 Phase1 인프로세스 stateless — 서버 블랙리스트 없이 클라가 토큰 폐기(무효화 저장소는 Phase2).
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final WmpJwtTokenProvider tokenProvider;

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest req) {
        User user = userMapper.findByEmail(req.email());
        if (user == null || !passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new BusinessException(WmpErrorCode.INVALID_CREDENTIALS);
        }
        if (!user.isActive()) {
            throw new BusinessException(WmpErrorCode.INVALID_CREDENTIALS);
        }
        TokenDto tokens = tokenProvider.generateTokenPair(toPrincipal(user));
        return new LoginResponse(tokens.getAccessToken(), tokens.getRefreshToken(), UserResponse.from(user));
    }

    @Transactional(readOnly = true)
    public TokenDto refresh(String refreshToken) {
        tokenProvider.validateToken(refreshToken); // 만료/위조 시 BusinessException
        BaseUserPrincipal parsed = tokenProvider.parsePrincipalFromToken(refreshToken);
        User user = userMapper.findById(parsed.getUserId());
        if (user == null || !user.isActive()) {
            throw new BusinessException(WmpErrorCode.INVALID_CREDENTIALS);
        }
        return tokenProvider.generateTokenPair(toPrincipal(user));
    }

    @Transactional(readOnly = true)
    public UserResponse me(Long userId) {
        User user = userMapper.findById(userId);
        if (user == null) {
            throw new BusinessException(WmpErrorCode.USER_NOT_FOUND);
        }
        return UserResponse.from(user);
    }

    /**
     * 가입 직후 자동 로그인 등에 쓰는 토큰쌍 발급 (CR-027 초대 수락).
     * 비밀번호 검증은 호출 측 책임 — 이미 본인확인이 끝난 user에 대해서만 호출한다.
     */
    public LoginResponse issueTokensFor(User user) {
        TokenDto tokens = tokenProvider.generateTokenPair(toPrincipal(user));
        return new LoginResponse(tokens.getAccessToken(), tokens.getRefreshToken(), UserResponse.from(user));
    }

    private WmpUserPrincipal toPrincipal(User user) {
        WmpUserPrincipal principal = new WmpUserPrincipal();
        principal.setUserId(user.getId());
        principal.setUsername(user.getEmail());
        principal.setRole(user.getRole());
        principal.setDepartmentId(user.getDepartmentId());
        return principal;
    }
}
