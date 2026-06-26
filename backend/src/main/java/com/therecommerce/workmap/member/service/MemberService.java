package com.therecommerce.workmap.member.service;

import com.therecommerce.workmap.member.domain.ProjectMember;
import com.therecommerce.workmap.member.dto.MemberDtos;
import com.therecommerce.workmap.member.mapper.ProjectMemberMapper;
import com.therecommerce.workmap.project.service.ProjectService;
import com.therecommerce.workmap.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 프로젝트 멤버 관리 (WMP-WS-005). 멤버 = 담당자/멘션 대상·비공개 조회 권한의 기준(BIZ-108).
 * 초대 시 프로젝트·사용자 존재를 검증한다.
 */
@Service
@RequiredArgsConstructor
public class MemberService {

    private final ProjectMemberMapper memberMapper;
    private final ProjectService projectService;
    private final UserService userService;

    @Transactional(readOnly = true)
    public List<MemberDtos.Response> list(Long projectId) {
        projectService.getEntity(projectId); // 존재 검증
        return memberMapper.findByProjectId(projectId);
    }

    @Transactional
    public void invite(Long projectId, MemberDtos.InviteRequest req) {
        projectService.getEntity(projectId);   // 프로젝트 존재 검증
        userService.getEntity(req.userId());     // 사용자 존재 검증
        memberMapper.insert(ProjectMember.builder()
                .projectId(projectId)
                .userId(req.userId())
                .role(req.roleOrDefault())
                .build());
    }

    @Transactional
    public void remove(Long projectId, Long userId) {
        projectService.getEntity(projectId);
        memberMapper.delete(projectId, userId);
    }
}
