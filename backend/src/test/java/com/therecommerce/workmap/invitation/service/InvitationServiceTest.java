package com.therecommerce.workmap.invitation.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.auth.dto.LoginResponse;
import com.therecommerce.workmap.auth.service.AuthService;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.invitation.config.AuthOtpProperties;
import com.therecommerce.workmap.invitation.domain.Invitation;
import com.therecommerce.workmap.invitation.dto.InvitationDtos.AcceptRequest;
import com.therecommerce.workmap.invitation.dto.InvitationDtos.InviteRequest;
import com.therecommerce.workmap.invitation.mapper.InvitationMapper;
import com.therecommerce.workmap.user.domain.User;
import com.therecommerce.workmap.user.dto.CreateUserRequest;
import com.therecommerce.workmap.user.mapper.UserMapper;
import com.therecommerce.workmap.user.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * InvitationService 단위테스트 (WMP-AUTH-004/006, CR-027 토큰 보정).
 * TokenService는 실제 사용(해시 결정적), NotificationClient·매퍼·UserService Mock.
 */
@ExtendWith(MockitoExtension.class)
class InvitationServiceTest {

    @Mock InvitationMapper invitationMapper;
    @Mock UserMapper userMapper;
    @Mock UserService userService;
    @Mock NotificationClient notificationClient;
    @Mock AuthService authService;
    TokenService tokenService = new TokenService();
    AuthOtpProperties props;
    InvitationService service;

    @BeforeEach
    void setUp() {
        props = new AuthOtpProperties();
        // 발송하는 케이스에서만 호출되므로 lenient(거부 케이스는 미호출 — UnnecessaryStubbing 회피).
        lenient().when(notificationClient.webBaseUrl()).thenReturn("http://test/web");
        service = new InvitationService(invitationMapper, userMapper, userService,
                tokenService, notificationClient, authService, props);
    }

    @Test
    @DisplayName("INV-1: 초대_invitation(토큰해시)생성+수락링크 발송(user 미생성)")
    void 초대_생성_링크발송() {
        InviteRequest req = new InviteRequest("new@therecommerce.com", "홍길동", "MEMBER", null);
        when(userMapper.existsByEmail(req.email())).thenReturn(false);
        when(invitationMapper.findPendingByEmail(req.email())).thenReturn(null);

        service.invite(req, 1L);

        verify(invitationMapper).insert(any(Invitation.class));
        // 수락 링크(actionUrl) 포함 이메일 발송
        verify(notificationClient).sendEmail(eq("new@therecommerce.com"), eq("WMP_INVITE_LINK"), any());
        verify(userService, never()).create(any()); // user는 수락 시점에만 생성
    }

    @Test
    @DisplayName("INV-2: 이미가입된이메일_초대거부(EMAIL_DUPLICATED)")
    void 가입이메일_거부() {
        InviteRequest req = new InviteRequest("dup@therecommerce.com", "중복", null, null);
        when(userMapper.existsByEmail(req.email())).thenReturn(true);

        assertThatThrownBy(() -> service.invite(req, 1L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.EMAIL_DUPLICATED);
        verify(invitationMapper, never()).insert(any());
    }

    @Test
    @DisplayName("INV-3: PENDING초대중복_거부(INVITATION_PENDING_DUPLICATED)")
    void PENDING중복_거부() {
        InviteRequest req = new InviteRequest("p@therecommerce.com", "보류", null, null);
        when(userMapper.existsByEmail(req.email())).thenReturn(false);
        when(invitationMapper.findPendingByEmail(req.email())).thenReturn(Invitation.builder().id(1L).build());

        assertThatThrownBy(() -> service.invite(req, 1L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.INVITATION_PENDING_DUPLICATED);
        verify(invitationMapper, never()).insert(any());
    }

    @Test
    @DisplayName("INV-4: 수락_토큰검증→user생성→ACCEPTED→자동로그인")
    void 수락_user생성_로그인() {
        AcceptRequest req = new AcceptRequest("raw-token-abc", "rawPassword123");
        Invitation pending = Invitation.builder()
                .id(9L).email("new@therecommerce.com").name("홍길동").role("MEMBER")
                .status("PENDING").expiresAt(OffsetDateTime.now().plusHours(1)).build();
        // 서비스가 raw 토큰을 해시해 조회 → 어떤 해시값이든 pending 반환
        when(invitationMapper.findPendingByTokenHash(anyString())).thenReturn(pending);
        User created = User.builder().id(50L).email("new@therecommerce.com").build();
        when(userMapper.findByEmail("new@therecommerce.com")).thenReturn(created);
        when(authService.issueTokensFor(created)).thenReturn(new LoginResponse("at", "rt", null));

        service.accept(req);

        verify(userService).create(any(CreateUserRequest.class));
        verify(invitationMapper).markAccepted(9L);
        verify(authService).issueTokensFor(created);
    }

    @Test
    @DisplayName("INV-5: 수락_토큰무효_거부(INVITATION_TOKEN_INVALID)")
    void 수락_토큰무효_거부() {
        AcceptRequest req = new AcceptRequest("bad-token", "rawPassword123");
        when(invitationMapper.findPendingByTokenHash(anyString())).thenReturn(null);

        assertThatThrownBy(() -> service.accept(req))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.INVITATION_TOKEN_INVALID);
        verify(userService, never()).create(any());
    }

    @Test
    @DisplayName("INV-6: 수락_만료토큰_EXPIRED처리+거부")
    void 수락_만료_거부() {
        AcceptRequest req = new AcceptRequest("expired-token", "rawPassword123");
        Invitation expired = Invitation.builder()
                .id(3L).email("old@therecommerce.com").status("PENDING")
                .expiresAt(OffsetDateTime.now().minusHours(1)).build();
        when(invitationMapper.findPendingByTokenHash(anyString())).thenReturn(expired);

        assertThatThrownBy(() -> service.accept(req))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.INVITATION_TOKEN_INVALID);
        verify(invitationMapper).updateStatus(3L, "EXPIRED");
        verify(userService, never()).create(any());
    }
}
