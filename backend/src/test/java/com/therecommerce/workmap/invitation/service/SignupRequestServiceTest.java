package com.therecommerce.workmap.invitation.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.invitation.domain.SignupRequest;
import com.therecommerce.workmap.invitation.dto.InvitationDtos.InviteRequest;
import com.therecommerce.workmap.invitation.dto.SignupDtos.ApproveRequest;
import com.therecommerce.workmap.invitation.dto.SignupDtos.SignupRequestBody;
import com.therecommerce.workmap.invitation.mapper.SignupRequestMapper;
import com.therecommerce.workmap.user.mapper.UserMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * SignupRequestService 단위테스트 (WMP-AUTH-010, CR-032).
 */
@ExtendWith(MockitoExtension.class)
class SignupRequestServiceTest {

    @Mock SignupRequestMapper signupMapper;
    @Mock UserMapper userMapper;
    @Mock InvitationService invitationService;
    @InjectMocks SignupRequestService service;

    @Test
    @DisplayName("SR-1: 신청_PENDING생성(user·초대 미생성)")
    void 신청_생성() {
        SignupRequestBody body = new SignupRequestBody("new@therecommerce.com", "홍길동", "합류 희망");
        when(userMapper.existsByEmail(body.email())).thenReturn(false);
        when(signupMapper.findPendingByEmail(body.email())).thenReturn(null);

        service.request(body);

        verify(signupMapper).insert(any(SignupRequest.class));
        verify(invitationService, never()).invite(any(), any());
    }

    @Test
    @DisplayName("SR-2: 이미가입된이메일_신청거부(EMAIL_DUPLICATED)")
    void 가입이메일_거부() {
        SignupRequestBody body = new SignupRequestBody("dup@therecommerce.com", "중복", null);
        when(userMapper.existsByEmail(body.email())).thenReturn(true);

        assertThatThrownBy(() -> service.request(body))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.EMAIL_DUPLICATED);
        verify(signupMapper, never()).insert(any());
    }

    @Test
    @DisplayName("SR-3: PENDING중복신청_거부(SIGNUP_REQUEST_PENDING_DUPLICATED)")
    void PENDING중복_거부() {
        SignupRequestBody body = new SignupRequestBody("p@therecommerce.com", "보류", null);
        when(userMapper.existsByEmail(body.email())).thenReturn(false);
        when(signupMapper.findPendingByEmail(body.email())).thenReturn(SignupRequest.builder().id(1L).build());

        assertThatThrownBy(() -> service.request(body))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.SIGNUP_REQUEST_PENDING_DUPLICATED);
        verify(signupMapper, never()).insert(any());
    }

    @Test
    @DisplayName("SR-4: 승인_역할지정→초대발송→APPROVED")
    void 승인_초대발송() {
        SignupRequest sr = SignupRequest.builder()
                .id(9L).email("new@therecommerce.com").name("홍길동").status("PENDING").build();
        when(signupMapper.findById(9L)).thenReturn(sr);

        service.approve(9L, new ApproveRequest("MANAGER", null), 1L);

        verify(invitationService).invite(any(InviteRequest.class), eq(1L));
        verify(signupMapper).markProcessed(9L, "APPROVED", 1L, null);
    }

    @Test
    @DisplayName("SR-5: 승인_이미처리됨_거부(SIGNUP_REQUEST_ALREADY_PROCESSED)")
    void 승인_이미처리_거부() {
        SignupRequest sr = SignupRequest.builder().id(9L).status("APPROVED").build();
        when(signupMapper.findById(9L)).thenReturn(sr);

        assertThatThrownBy(() -> service.approve(9L, new ApproveRequest(null, null), 1L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.SIGNUP_REQUEST_ALREADY_PROCESSED);
        verify(invitationService, never()).invite(any(), any());
    }

    @Test
    @DisplayName("SR-6: 거절_REJECTED처리(사유)")
    void 거절() {
        SignupRequest sr = SignupRequest.builder().id(9L).status("PENDING").build();
        when(signupMapper.findById(9L)).thenReturn(sr);

        service.reject(9L, "권한 없음", 1L);

        verify(signupMapper).markProcessed(9L, "REJECTED", 1L, "권한 없음");
        verify(invitationService, never()).invite(any(), any());
    }

    @Test
    @DisplayName("SR-7: 없는 신청_거부(SIGNUP_REQUEST_NOT_FOUND)")
    void 없는신청_거부() {
        when(signupMapper.findById(99L)).thenReturn(null);

        assertThatThrownBy(() -> service.reject(99L, null, 1L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.SIGNUP_REQUEST_NOT_FOUND);
    }
}
