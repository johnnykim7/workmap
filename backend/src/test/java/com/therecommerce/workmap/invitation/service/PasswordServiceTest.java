package com.therecommerce.workmap.invitation.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.invitation.domain.OtpPurpose;
import com.therecommerce.workmap.invitation.dto.InvitationDtos.ChangeRequest;
import com.therecommerce.workmap.invitation.dto.InvitationDtos.ResetRequest;
import com.therecommerce.workmap.user.domain.User;
import com.therecommerce.workmap.user.mapper.UserMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

/**
 * PasswordService 단위테스트 (WMP-AUTH-007/008, CR-027).
 */
@ExtendWith(MockitoExtension.class)
class PasswordServiceTest {

    @Mock UserMapper userMapper;
    @Mock OtpService otpService;
    PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    PasswordService service() {
        return new PasswordService(userMapper, otpService, passwordEncoder);
    }

    private User activeUser(Long id, String email, String rawPw) {
        return User.builder().id(id).email(email).name("n")
                .passwordHash(passwordEncoder.encode(rawPw)).isActive(true).build();
    }

    @Test
    @DisplayName("PW-1: forgot_존재계정_RESET인증번호발송")
    void forgot_발송() {
        User user = activeUser(7L, "a@b.com", "current123");
        when(userMapper.findByEmail("a@b.com")).thenReturn(user);

        service().requestForgot("a@b.com");

        verify(otpService).issue("a@b.com", OtpPurpose.RESET, 7L, "n");
    }

    @Test
    @DisplayName("PW-2: forgot_미존재계정_계정열거방지(발송 스킵+예외없음)")
    void forgot_미존재_스킵() {
        when(userMapper.findByEmail("none@b.com")).thenReturn(null);

        service().requestForgot("none@b.com"); // 예외 없음

        verify(otpService, never()).issue(any(), any(), any(), any());
    }

    @Test
    @DisplayName("PW-3: reset_인증번호검증후_비밀번호갱신")
    void reset_갱신() {
        ResetRequest req = new ResetRequest("a@b.com", "123456", "newPassword123");
        User user = activeUser(7L, "a@b.com", "current123");
        when(userMapper.findByEmail("a@b.com")).thenReturn(user);

        service().reset(req);

        verify(otpService).verifyAndConsume("a@b.com", OtpPurpose.RESET, "123456");
        verify(userMapper).updatePassword(eq(7L), anyString());
    }

    @Test
    @DisplayName("PW-4: change_현재PW일치+인증번호검증_갱신")
    void change_갱신() {
        ChangeRequest req = new ChangeRequest("current123", "123456", "newPassword123");
        User user = activeUser(7L, "a@b.com", "current123");
        when(userMapper.findById(7L)).thenReturn(user);

        service().change(7L, req);

        verify(otpService).verifyAndConsume("a@b.com", OtpPurpose.CHANGE, "123456");
        verify(userMapper).updatePassword(eq(7L), anyString());
    }

    @Test
    @DisplayName("PW-5: change_현재PW불일치_거부(INVALID_CREDENTIALS)")
    void change_현재PW불일치_거부() {
        ChangeRequest req = new ChangeRequest("wrongPw", "123456", "newPassword123");
        User user = activeUser(7L, "a@b.com", "current123");
        when(userMapper.findById(7L)).thenReturn(user);

        assertThatThrownBy(() -> service().change(7L, req))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.INVALID_CREDENTIALS);
        verify(userMapper, never()).updatePassword(any(), any());
        verify(otpService, never()).verifyAndConsume(any(), any(), any());
    }

    @Test
    @DisplayName("PW-6: change_새PW가현재와동일_거부(PASSWORD_SAME_AS_CURRENT)")
    void change_동일PW_거부() {
        ChangeRequest req = new ChangeRequest("current123", "123456", "current123");
        User user = activeUser(7L, "a@b.com", "current123");
        when(userMapper.findById(7L)).thenReturn(user);

        assertThatThrownBy(() -> service().change(7L, req))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.PASSWORD_SAME_AS_CURRENT);
        verify(userMapper, never()).updatePassword(any(), any());
    }
}
