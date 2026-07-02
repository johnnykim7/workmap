package com.therecommerce.workmap.invitation.dto;

import com.therecommerce.workmap.invitation.domain.SignupRequest;
import com.therecommerce.workmap.user.domain.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;

/**
 * 가입 요청 관련 DTO (WMP-AUTH-010, CR-032).
 */
public final class SignupDtos {

    private SignupDtos() {
    }

    /** 셀프 가입 신청(공개). */
    public record SignupRequestBody(
            @NotBlank @Email String email,
            @NotBlank @Size(max = 50) String name,
            @Size(max = 500) String reason
    ) {
    }

    /** 승인(Admin) — 생성될 user의 역할 지정. */
    public record ApproveRequest(
            String role
    ) {
        public String roleOrDefault() {
            return (role == null || role.isBlank()) ? UserRole.MEMBER.name() : role;
        }
    }

    /** 거절(Admin) — 사유 선택. */
    public record RejectRequest(
            @Size(max = 500) String reason
    ) {
    }

    /** 가입 요청 응답. */
    public record SignupRequestResponse(
            Long id,
            String email,
            String name,
            String reason,
            String status,
            OffsetDateTime createdAt
    ) {
        public static SignupRequestResponse from(SignupRequest r) {
            return new SignupRequestResponse(r.getId(), r.getEmail(), r.getName(),
                    r.getReason(), r.getStatus(), r.getCreatedAt());
        }
    }
}
