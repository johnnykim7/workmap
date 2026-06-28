package com.therecommerce.workmap.invitation.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.auth.dto.LoginResponse;
import com.therecommerce.workmap.auth.service.AuthService;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.invitation.config.AuthOtpProperties;
import com.therecommerce.workmap.invitation.domain.Invitation;
import com.therecommerce.workmap.invitation.domain.OtpPurpose;
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
import static org.mockito.Mockito.*;

/**
 * InvitationService 단위테스트 (WMP-AUTH-004/006, CR-027).
 */
@ExtendWith(MockitoExtension.class)
class InvitationServiceTest {

    @Mock InvitationMapper invitationMapper;
    @Mock UserMapper userMapper;
    @Mock UserService userService;
    @Mock OtpService otpService;
    @Mock AuthService authService;
    AuthOtpProperties props;
    InvitationService service;

    @BeforeEach
    void setUp() {
        props = new AuthOtpProperties();
        service = new InvitationService(invitationMapper, userMapper, userService, otpService, authService, props);
    }

    @Test
    @DisplayName("INV-1: 초대_invitation생성+INVITE인증번호발송(user는 미생성)")
    void 초대_invitation생성_발송() {
        InviteRequest req = new InviteRequest("new@therecommerce.com", "홍길동", "MEMBER", null);
        when(userMapper.existsByEmail(req.email())).thenReturn(false);
        when(invitationMapper.findPendingByEmail(req.email())).thenReturn(null);

        service.invite(req, 1L);

        verify(invitationMapper).insert(any(Invitation.class));
        verify(otpService).issue(eq("new@therecommerce.com"), eq(OtpPurpose.INVITE), isNull(), eq("홍길동"));
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
    @DisplayName("INV-4: 수락_인증번호검증→user생성→ACCEPTED→자동로그인")
    void 수락_user생성_로그인() {
        AcceptRequest req = new AcceptRequest("new@therecommerce.com", "123456", "rawPassword123");
        Invitation pending = Invitation.builder()
                .id(9L).email("new@therecommerce.com").name("홍길동").role("MEMBER")
                .status("PENDING").expiresAt(OffsetDateTime.now().plusHours(1)).build();
        when(invitationMapper.findPendingByEmail("new@therecommerce.com")).thenReturn(pending);
        User created = User.builder().id(50L).email("new@therecommerce.com").build();
        when(userMapper.findByEmail("new@therecommerce.com")).thenReturn(created);
        when(authService.issueTokensFor(created)).thenReturn(new LoginResponse("at", "rt", null));

        service.accept(req);

        verify(otpService).verifyAndConsume("new@therecommerce.com", OtpPurpose.INVITE, "123456");
        verify(userService).create(any(CreateUserRequest.class));
        verify(invitationMapper).markAccepted(9L);
        verify(authService).issueTokensFor(created);
    }

    @Test
    @DisplayName("INV-5: 수락_PENDING초대없음_거부(INVITATION_NOT_FOUND)")
    void 수락_초대없음_거부() {
        AcceptRequest req = new AcceptRequest("none@therecommerce.com", "123456", "rawPassword123");
        when(invitationMapper.findPendingByEmail("none@therecommerce.com")).thenReturn(null);

        assertThatThrownBy(() -> service.accept(req))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.INVITATION_NOT_FOUND);
        verify(userService, never()).create(any());
    }

    @Test
    @DisplayName("INV-6: 수락_만료초대_EXPIRED처리+거부")
    void 수락_만료_거부() {
        AcceptRequest req = new AcceptRequest("old@therecommerce.com", "123456", "rawPassword123");
        Invitation expired = Invitation.builder()
                .id(3L).email("old@therecommerce.com").status("PENDING")
                .expiresAt(OffsetDateTime.now().minusHours(1)).build();
        when(invitationMapper.findPendingByEmail("old@therecommerce.com")).thenReturn(expired);

        assertThatThrownBy(() -> service.accept(req))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.INVITATION_EXPIRED);
        verify(invitationMapper).updateStatus(3L, "EXPIRED");
        verify(otpService, never()).verifyAndConsume(any(), any(), any());
    }
}
