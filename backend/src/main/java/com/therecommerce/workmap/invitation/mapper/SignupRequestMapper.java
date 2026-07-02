package com.therecommerce.workmap.invitation.mapper;

import com.therecommerce.workmap.invitation.domain.SignupRequest;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * signup_requests MyBatis 매퍼. SQL은 resources/mapper/SignupRequestMapper.xml.
 */
@Mapper
public interface SignupRequestMapper {

    void insert(SignupRequest req);

    SignupRequest findById(@Param("id") Long id);

    /** PENDING 신청 조회 — 중복검사용. */
    SignupRequest findPendingByEmail(@Param("email") String email);

    List<SignupRequest> findByStatus(@Param("status") String status);

    /** 승인/거절 처리 — status·처리자·사유·시각 갱신. */
    void markProcessed(@Param("id") Long id, @Param("status") String status,
                       @Param("processedBy") Long processedBy, @Param("rejectReason") String rejectReason);
}
