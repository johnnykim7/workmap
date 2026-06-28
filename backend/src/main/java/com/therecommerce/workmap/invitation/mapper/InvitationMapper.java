package com.therecommerce.workmap.invitation.mapper;

import com.therecommerce.workmap.invitation.domain.Invitation;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * invitations 테이블 MyBatis 매퍼. SQL은 resources/mapper/InvitationMapper.xml.
 */
@Mapper
public interface InvitationMapper {

    void insert(Invitation invitation);

    Invitation findById(@Param("id") Long id);

    /** PENDING(미만료) 초대 1건 조회 — 수락/중복검사용. */
    Invitation findPendingByEmail(@Param("email") String email);

    List<Invitation> findByStatus(@Param("status") String status);

    void updateStatus(@Param("id") Long id, @Param("status") String status);

    /** 수락 처리 — status=ACCEPTED + accepted_at=now(). */
    void markAccepted(@Param("id") Long id);
}
