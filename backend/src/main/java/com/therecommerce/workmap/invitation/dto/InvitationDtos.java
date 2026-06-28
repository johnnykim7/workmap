package com.therecommerce.workmap.invitation.dto;

import com.therecommerce.workmap.invitation.domain.Invitation;
import com.therecommerce.workmap.user.domain.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;

/**
 * 초대/인증번호/비밀번호 관련 요청·응답 DTO (CR-027).
 * 인증번호 평문·비밀번호는 응답에 절대 포함하지 않는다.
 */
public final class InvitationDtos {

    private InvitationDtos() {
    }

    // --- 초대 (Admin) ---

    /** 사용자 초대 요청(WMP-AUTH-004). */
    public record InviteRequest(
            @NotBlank @Email String email,
            @NotBlank @Size(max = 50) String name,
            String role,
            Long departmentId
    ) {
        public String roleOrDefault() {
            return (role == null || role.isBlank()) ? UserRole.MEMBER.name() : role;
        }
    }

    /** 초대 응답 — 인증번호는 미반환. */
    public record InvitationResponse(
            Long id,
            String email,
            String name,
            String role,
            String status,
            OffsetDateTime expiresAt,
            OffsetDateTime createdAt
    ) {
        public static InvitationResponse from(Invitation i) {
            return new InvitationResponse(i.getId(), i.getEmail(), i.getName(),
                    i.getRole(), i.getStatus(), i.getExpiresAt(), i.getCreatedAt());
        }
    }

    // --- 초대 수락 (공개, WMP-AUTH-006) ---

    public record AcceptRequest(
            @NotBlank @Email String email,
            @NotBlank @Size(min = 6, max = 6) String code,
            @NotBlank @Size(min = 8, max = 72) String password
    ) {
    }

    // --- 비밀번호 분실 재설정 (공개, WMP-AUTH-007) ---

    /** 1단계 — 인증번호 발송. 계정 열거 방지로 항상 성공 응답. */
    public record ForgotRequest(
            @NotBlank @Email String email
    ) {
    }

    /** 2단계 — 인증번호 검증 + 새 비밀번호. */
    public record ResetRequest(
            @NotBlank @Email String email,
            @NotBlank @Size(min = 6, max = 6) String code,
            @NotBlank @Size(min = 8, max = 72) String password
    ) {
    }

    // --- 비밀번호 변경 (로그인, WMP-AUTH-008) ---

    /** 2단계 — 현재 PW + 인증번호 + 새 PW(2차 인증). */
    public record ChangeRequest(
            @NotBlank String currentPassword,
            @NotBlank @Size(min = 6, max = 6) String code,
            @NotBlank @Size(min = 8, max = 72) String newPassword
    ) {
    }
}
