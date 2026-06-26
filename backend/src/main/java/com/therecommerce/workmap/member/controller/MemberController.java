package com.therecommerce.workmap.member.controller;

import com.therecommerce.common.response.ResponseDto;
import com.therecommerce.workmap.member.dto.MemberDtos;
import com.therecommerce.workmap.member.service.MemberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 프로젝트 멤버 API (T3-2 E). 초대/제거는 Manager 이상(POL-004).
 */
@RestController
@RequestMapping("/api/v1/projects/{projectId}/members")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;

    @GetMapping
    public ResponseDto<List<MemberDtos.Response>> list(@PathVariable Long projectId) {
        return ResponseDto.success(memberService.list(projectId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN','OWNER')")
    public ResponseDto<Void> invite(
            @PathVariable Long projectId, @Valid @RequestBody MemberDtos.InviteRequest req) {
        memberService.invite(projectId, req);
        return ResponseDto.success(null);
    }

    @DeleteMapping("/{userId}")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN','OWNER')")
    public ResponseDto<Void> remove(@PathVariable Long projectId, @PathVariable Long userId) {
        memberService.remove(projectId, userId);
        return ResponseDto.success(null);
    }
}
