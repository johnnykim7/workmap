package com.therecommerce.workmap.invitation.mapper;

import com.therecommerce.workmap.invitation.domain.EmailOtp;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * email_otp 테이블 MyBatis 매퍼. SQL은 resources/mapper/EmailOtpMapper.xml.
 */
@Mapper
public interface EmailOtpMapper {

    void insert(EmailOtp otp);

    /** 검증 대상 = 미소비·미만료 최신 인증번호 1건. */
    EmailOtp findLatestActive(@Param("email") String email, @Param("purpose") String purpose);

    /** 가장 최근 발급 1건(소비 여부 무관) — 재발송 쿨다운 판정용. */
    EmailOtp findLatestAny(@Param("email") String email, @Param("purpose") String purpose);

    void incrementAttempt(@Param("id") Long id);

    void markConsumed(@Param("id") Long id);

    /** 같은 이메일·용도의 미소비 인증번호 전부 소비 처리(재발급 시 이전 무효화). */
    void consumeAllActive(@Param("email") String email, @Param("purpose") String purpose);
}
