package com.therecommerce.workmap.auth.service;

import com.therecommerce.common.config.JwtProperties;
import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.common.security.jwt.TokenDto;
import com.therecommerce.workmap.auth.dto.LoginRequest;
import com.therecommerce.workmap.auth.dto.LoginResponse;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.common.security.WmpJwtTokenProvider;
import com.therecommerce.workmap.user.domain.User;
import com.therecommerce.workmap.user.mapper.UserMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

/**
 * AuthService 단위테스트 (T3-5 AUTH-1~4).
 * UserMapper Mock + 실제 BCrypt + 실제 WmpJwtTokenProvider(토큰 발급/검증 검증).
 */
class AuthServiceTest {

    UserMapper userMapper;
    PasswordEncoder passwordEncoder;
    WmpJwtTokenProvider tokenProvider;
    AuthService authService;

    @BeforeEach
    void setUp() {
        userMapper = mock(UserMapper.class);
        passwordEncoder = new BCryptPasswordEncoder();
        JwtProperties props = new JwtProperties();
        // 32바이트 이상 base64 시크릿
        props.setSecret("dGVzdC1zZWNyZXQta2V5LWZvci13b3JrbWFwLXVuaXQtdGVzdC1zZWNyZXQ=");
        props.setAccessExpiration(3600000L);
        props.setRefreshExpiration(604800000L);
        tokenProvider = new WmpJwtTokenProvider(props);
        authService = new AuthService(userMapper, passwordEncoder, tokenProvider);
    }

    private User activeUser(String rawPassword) {
        return User.builder()
                .id(42L)
                .email("user@therecommerce.com")
                .passwordHash(passwordEncoder.encode(rawPassword))
                .name("사용자")
                .role("MANAGER")
                .departmentId(3L)
                .isActive(true)
                .build();
    }

    @Test
    @DisplayName("AUTH-1: 정상로그인_토큰발급(role·userId 클레임 포함)")
    void 정상로그인_토큰발급() {
        when(userMapper.findByEmail("user@therecommerce.com")).thenReturn(activeUser("pw12345678"));

        LoginResponse res = authService.login(new LoginRequest("user@therecommerce.com", "pw12345678"));

        assertThat(res.accessToken()).isNotBlank();
        assertThat(res.refreshToken()).isNotBlank();
        assertThat(res.user().id()).isEqualTo(42L);
        assertThat(res.user().role()).isEqualTo("MANAGER");
        // 발급된 Access 토큰에서 userId/role 클레임 복원
        var principal = tokenProvider.parsePrincipalFromToken(res.accessToken());
        assertThat(principal.getUserId()).isEqualTo(42L);
        assertThat(principal.getRole()).isEqualTo("MANAGER");
    }

    @Test
    @DisplayName("AUTH-2: 비밀번호불일치_인증실패(토큰 미발급)")
    void 비밀번호불일치_인증실패() {
        when(userMapper.findByEmail("user@therecommerce.com")).thenReturn(activeUser("correctPw123"));

        assertThatThrownBy(() ->
                authService.login(new LoginRequest("user@therecommerce.com", "wrongPw123")))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.INVALID_CREDENTIALS);
    }

    @Test
    @DisplayName("AUTH-3: 비활성계정_로그인거부")
    void 비활성계정_로그인거부() {
        User inactive = activeUser("pw12345678");
        inactive.setActive(false);
        when(userMapper.findByEmail("user@therecommerce.com")).thenReturn(inactive);

        assertThatThrownBy(() ->
                authService.login(new LoginRequest("user@therecommerce.com", "pw12345678")))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.INVALID_CREDENTIALS);
    }

    @Test
    @DisplayName("AUTH-4: 유효Refresh_AccessToken갱신")
    void 유효Refresh_AccessToken갱신() {
        User user = activeUser("pw12345678");
        when(userMapper.findByEmail("user@therecommerce.com")).thenReturn(user);
        when(userMapper.findById(42L)).thenReturn(user);

        LoginResponse login = authService.login(new LoginRequest("user@therecommerce.com", "pw12345678"));
        TokenDto refreshed = authService.refresh(login.refreshToken());

        assertThat(refreshed.getAccessToken()).isNotBlank();
        var principal = tokenProvider.parsePrincipalFromToken(refreshed.getAccessToken());
        assertThat(principal.getUserId()).isEqualTo(42L);
    }
}
