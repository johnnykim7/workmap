package com.therecommerce.workmap.ops.dto;

import com.therecommerce.workmap.ops.domain.FieldVerification;
import com.therecommerce.workmap.workitem.dto.WorkItemDtos;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.OffsetDateTime;

/** 현장검증 기록 API DTO(T3-2 H, WMP-OPS-004, CR-012). */
public final class VerificationDtos {

    private VerificationDtos() {}

    /**
     * 현장검증 기록 생성 요청. 검증자/검증일/결과는 필수(field_verifications NOT NULL).
     * createFollowUp=true면 발견 이슈(issuesFound)를 후속 업무 항목으로 생성(원본↔후속 RELATES_TO).
     */
    public record CreateRequest(
            @NotBlank String verifier,
            @NotNull LocalDate verifiedDate,
            String location,
            String environment,
            String testContent,
            @NotBlank String result,        // PASS / FAIL / PARTIAL
            String issuesFound,
            boolean createFollowUp,         // 발견 이슈 → 후속 업무 생성 여부
            Long followUpProjectId,         // 후속 업무 대상 프로젝트(미지정 시 원본 프로젝트)
            String followUpIssueType        // 후속 업무 유형(미지정 시 BUG)
    ) {}

    /** 현장검증 기록 응답. */
    public record Response(
            Long id,
            Long workItemId,
            String verifier,
            LocalDate verifiedDate,
            String location,
            String environment,
            String testContent,
            String result,
            String issuesFound,
            OffsetDateTime createdAt
    ) {
        public static Response from(FieldVerification v) {
            return new Response(v.getId(), v.getWorkItemId(), v.getVerifier(), v.getVerifiedDate(),
                    v.getLocation(), v.getEnvironment(), v.getTestContent(),
                    v.getResult(), v.getIssuesFound(), v.getCreatedAt());
        }
    }

    /** 기록 생성 결과: 저장된 기록 + (생성된 경우) 후속 업무 항목. */
    public record CreateResult(
            Response verification,
            WorkItemDtos.Response followUp   // createFollowUp=false거나 발견이슈 없으면 null
    ) {}
}
