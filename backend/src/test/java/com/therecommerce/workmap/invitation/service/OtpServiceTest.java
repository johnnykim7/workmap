package com.therecommerce.workmap.invitation.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.invitation.config.AuthOtpProperties;
import com.therecommerce.workmap.invitation.domain.EmailOtp;
import com.therecommerce.workmap.invitation.domain.OtpPurpose;
import com.therecommerce.workmap.invitation.mapper.EmailOtpMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.OffsetDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

/**
 * OtpService 단위테스트 (POL-013, CR-027). EmailOtpMapper Mock, 실제 BCrypt, NotificationClient Mock.
 */
@ExtendWith(MockitoExtension.class)
class OtpServiceTest {

    @Mock EmailOtpMapper otpMapper;
    @Mock NotificationClient notificationClient;
    @Mock OtpAttemptRecorder attemptRecorder;
    PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    AuthOtpProperties props;
    OtpService otpService;

    @BeforeEach
    void setUp() {
        props = new AuthOtpProperties(); // 만료10/시도5/쿨다운60/초대72h 기본
        otpService = new OtpService(otpMapper, passwordEncoder, notificationClient, attemptRecorder, props);
    }

    @Test
    @DisplayName("OTP-1: 발급_6자리저장+이메일발송+이전무효화")
    void 발급_해시저장_발송() {
        when(otpMapper.findLatestAny("a@b.com", "INVITE")).thenReturn(null); // 쿨다운 없음

        otpService.issue("a@b.com", OtpPurpose.INVITE, null, "홍길동");

        verify(otpMapper).consumeAllActive("a@b.com", "INVITE"); // 이전 무효화
        ArgumentCaptor<EmailOtp> captor = ArgumentCaptor.forClass(EmailOtp.class);
        verify(otpMapper).insert(captor.capture());
        EmailOtp saved = captor.getValue();
        assertThat(saved.getCodeHash()).startsWith("$2"); // 평문 미저장(해시)
        assertThat(saved.getPurpose()).isEqualTo("INVITE");
        verify(notificationClient).sendEmail(eq("a@b.com"), eq("WMP_INVITE_OTP"), any());
    }

    @Test
    @DisplayName("OTP-2: 재발송쿨다운_60초이내_거부")
    void 재발송쿨다운_거부() {
        EmailOtp recent = EmailOtp.builder()
                .createdAt(OffsetDateTime.now().minusSeconds(10)).build(); // 10초 전 발급
        when(otpMapper.findLatestAny("a@b.com", "RESET")).thenReturn(recent);

        assertThatThrownBy(() -> otpService.issue("a@b.com", OtpPurpose.RESET, 1L, "n"))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.OTP_RESEND_COOLDOWN);
        verify(otpMapper, never()).insert(any());
    }

    @Test
    @DisplayName("OTP-3: 검증성공_소비처리(1회용)")
    void 검증성공_소비() {
        EmailOtp otp = EmailOtp.builder()
                .id(5L).codeHash(passwordEncoder.encode("123456"))
                .attemptCount(0).expiresAt(OffsetDateTime.now().plusMinutes(5)).build();
        when(otpMapper.findLatestActive("a@b.com", "INVITE")).thenReturn(otp);

        otpService.verifyAndConsume("a@b.com", OtpPurpose.INVITE, "123456");

        verify(otpMapper).markConsumed(5L);
    }

    @Test
    @DisplayName("OTP-4: 인증번호없음_거부(OTP_NOT_FOUND)")
    void 인증번호없음_거부() {
        when(otpMapper.findLatestActive("a@b.com", "INVITE")).thenReturn(null);

        assertThatThrownBy(() -> otpService.verifyAndConsume("a@b.com", OtpPurpose.INVITE, "000000"))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.OTP_NOT_FOUND);
    }

    @Test
    @DisplayName("OTP-5: 만료_거부(OTP_EXPIRED)")
    void 만료_거부() {
        EmailOtp expired = EmailOtp.builder()
                .id(5L).codeHash(passwordEncoder.encode("123456"))
                .attemptCount(0).expiresAt(OffsetDateTime.now().minusMinutes(1)).build();
        when(otpMapper.findLatestActive("a@b.com", "RESET")).thenReturn(expired);

        assertThatThrownBy(() -> otpService.verifyAndConsume("a@b.com", OtpPurpose.RESET, "123456"))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.OTP_EXPIRED);
    }

    @Test
    @DisplayName("OTP-6: 시도초과_거부+폐기(OTP_ATTEMPTS_EXCEEDED)")
    void 시도초과_거부() {
        EmailOtp maxed = EmailOtp.builder()
                .id(5L).codeHash(passwordEncoder.encode("123456"))
                .attemptCount(5).expiresAt(OffsetDateTime.now().plusMinutes(5)).build();
        when(otpMapper.findLatestActive("a@b.com", "CHANGE")).thenReturn(maxed);

        assertThatThrownBy(() -> otpService.verifyAndConsume("a@b.com", OtpPurpose.CHANGE, "123456"))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.OTP_ATTEMPTS_EXCEEDED);
        verify(attemptRecorder).consume(5L); // 폐기(독립 트랜잭션)
    }

    @Test
    @DisplayName("OTP-7: 불일치_시도증가+거부(OTP_MISMATCH)")
    void 불일치_거부() {
        EmailOtp otp = EmailOtp.builder()
                .id(5L).codeHash(passwordEncoder.encode("123456"))
                .attemptCount(0).expiresAt(OffsetDateTime.now().plusMinutes(5)).build();
        when(otpMapper.findLatestActive("a@b.com", "INVITE")).thenReturn(otp);

        assertThatThrownBy(() -> otpService.verifyAndConsume("a@b.com", OtpPurpose.INVITE, "999999"))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.OTP_MISMATCH);
        verify(attemptRecorder).increment(5L);    // 독립 트랜잭션으로 시도횟수 커밋
        verify(attemptRecorder, never()).consume(5L); // 아직 한도 미도달
    }

    @Test
    @DisplayName("OTP-8: 불일치 후 한도도달_즉시폐기(다음 시도 차단)")
    void 불일치_한도도달_폐기() {
        // attemptCount=4, 한 번 더 틀리면 5 도달 → 즉시 폐기
        EmailOtp otp = EmailOtp.builder()
                .id(5L).codeHash(passwordEncoder.encode("123456"))
                .attemptCount(4).expiresAt(OffsetDateTime.now().plusMinutes(5)).build();
        when(otpMapper.findLatestActive("a@b.com", "INVITE")).thenReturn(otp);

        assertThatThrownBy(() -> otpService.verifyAndConsume("a@b.com", OtpPurpose.INVITE, "999999"))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.OTP_MISMATCH);
        verify(attemptRecorder).increment(5L);
        verify(attemptRecorder).consume(5L); // 한도 도달 → 폐기
    }
}
