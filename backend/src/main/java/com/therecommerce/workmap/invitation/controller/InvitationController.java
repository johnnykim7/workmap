package com.therecommerce.workmap.invitation.controller;

import com.therecommerce.common.response.ResponseDto;
import com.therecommerce.common.security.auth.AuthUserInfo;
import com.therecommerce.workmap.invitation.dto.InvitationDtos.InvitationResponse;
import com.therecommerce.workmap.invitation.dto.InvitationDtos.InviteRequest;
import com.therecommerce.workmap.invitation.service.InvitationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 사용자 초대 API (T3-2 B, WMP-AUTH-004). 초대 생성·목록·재발송·취소는 Admin 전용(POL-004).
 * 수락(공개)은 AuthController(/auth/invitations/accept)가 담당.
 */
@RestController
@RequestMapping("/api/v1/invitations")
@RequiredArgsConstructor
public class InvitationController {

    private final InvitationService invitationService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    public ResponseDto<InvitationResponse> invite(@Valid @RequestBody InviteRequest req,
                                                  @AuthUserInfo("userId") Long invitedBy) {
        return ResponseDto.success(invitationService.invite(req, invitedBy));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    public ResponseDto<List<InvitationResponse>> list(@RequestParam(required = false) String status) {
        return ResponseDto.success(invitationService.list(status));
    }

    @PostMapping("/{id}/resend")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    public ResponseDto<Void> resend(@PathVariable Long id) {
        invitationService.resend(id);
        return ResponseDto.success(null);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    public ResponseDto<Void> revoke(@PathVariable Long id) {
        invitationService.revoke(id);
        return ResponseDto.success(null);
    }
}
