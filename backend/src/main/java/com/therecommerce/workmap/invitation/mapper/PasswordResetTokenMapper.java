package com.therecommerce.workmap.invitation.mapper;

import com.therecommerce.workmap.invitation.domain.PasswordResetToken;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * password_reset_tokens MyBatis 매퍼. SQL은 resources/mapper/PasswordResetTokenMapper.xml.
 */
@Mapper
public interface PasswordResetTokenMapper {

    void insert(PasswordResetToken token);

    /** 검증 대상 = 미소비·미만료 토큰(해시 일치). */
    PasswordResetToken findActiveByTokenHash(@Param("tokenHash") String tokenHash);

    void markConsumed(@Param("id") Long id);

    /** 같은 user의 미소비 토큰 전부 무효화(재발급 시 이전 무효). */
    void consumeAllByUser(@Param("userId") Long userId);
}
