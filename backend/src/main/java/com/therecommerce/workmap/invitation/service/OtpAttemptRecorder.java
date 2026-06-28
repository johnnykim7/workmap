package com.therecommerce.workmap.invitation.service;

import com.therecommerce.workmap.invitation.mapper.EmailOtpMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * 인증번호 검증 실패 카운팅을 독립 트랜잭션으로 커밋한다 (POL-013, CR-027).
 * <p>
 * 검증 실패 시 {@link OtpService#verifyAndConsume}는 BusinessException을 던지는데,
 * 이 예외가 메인 트랜잭션을 롤백시키면 incrementAttempt/markConsumed도 함께 취소되어
 * 시도횟수 제한이 무력화된다(인증번호 brute-force 가능). 카운팅을 REQUIRES_NEW로 분리해
 * 메인 롤백과 무관하게 즉시 커밋한다. self-invocation은 프록시를 안 타므로 반드시 별도 빈.
 */
@Component
@RequiredArgsConstructor
public class OtpAttemptRecorder {

    private final EmailOtpMapper otpMapper;

    /** 시도횟수 +1을 즉시 커밋. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void increment(Long otpId) {
        otpMapper.incrementAttempt(otpId);
    }

    /** 폐기(소비 처리)를 즉시 커밋. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void consume(Long otpId) {
        otpMapper.markConsumed(otpId);
    }
}
