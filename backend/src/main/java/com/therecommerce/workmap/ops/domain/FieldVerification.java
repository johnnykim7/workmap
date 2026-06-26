package com.therecommerce.workmap.ops.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.OffsetDateTime;

/**
 * 현장검증 기록(WMP-OPS-004, CR-012, 기획서 §10.2). 검증자/검증일/장소/환경/테스트내용/결과/발견이슈.
 *
 * <p>단순 체크박스가 아니라 검증 컨텍스트를 기록한다. 발견 이슈가 있으면 후속 업무 항목 생성 가능
 * (서비스 createFollowUp 옵션). 상태 전이(현장검증형 워크플로)는 기록이 직접 하지 않고 별도 FSM 전이로(BIZ-010).
 * MyBatis setter 매핑 위해 @NoArgsConstructor + setter(CR-008 규칙).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FieldVerification {

    private Long id;
    private Long workItemId;
    private String verifier;
    private LocalDate verifiedDate;
    private String location;
    private String environment;
    private String testContent;
    private String result;        // PASS / FAIL / PARTIAL
    private String issuesFound;
    private OffsetDateTime createdAt;
}
