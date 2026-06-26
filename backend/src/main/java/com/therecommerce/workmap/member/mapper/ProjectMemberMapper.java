package com.therecommerce.workmap.member.mapper;

import com.therecommerce.workmap.member.domain.ProjectMember;
import com.therecommerce.workmap.member.dto.MemberDtos;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * project_members 테이블 MyBatis 매퍼. SQL은 resources/mapper/ProjectMemberMapper.xml.
 */
@Mapper
public interface ProjectMemberMapper {

    /** 신규 멤버 추가. 이미 존재하면(PK 충돌) 무시(ON CONFLICT). */
    void insert(ProjectMember member);

    /** 멤버 + 사용자 정보 조인 목록. */
    List<MemberDtos.Response> findByProjectId(@Param("projectId") Long projectId);

    boolean exists(@Param("projectId") Long projectId, @Param("userId") Long userId);

    void delete(@Param("projectId") Long projectId, @Param("userId") Long userId);

    /** BIZ-108 가시성 필터: 사용자가 멤버로 속한 프로젝트 id 목록. */
    List<Long> findProjectIdsByUserId(@Param("userId") Long userId);

    /** 프로젝트 내 사용자 역할(승인 권한 검증, BIZ-111). 멤버 아니면 null. */
    String findRole(@Param("projectId") Long projectId, @Param("userId") Long userId);
}
