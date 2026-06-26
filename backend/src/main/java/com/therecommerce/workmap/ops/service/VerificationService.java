package com.therecommerce.workmap.ops.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.ops.domain.FieldVerification;
import com.therecommerce.workmap.ops.dto.VerificationDtos;
import com.therecommerce.workmap.ops.mapper.FieldVerificationMapper;
import com.therecommerce.workmap.workitem.domain.IssueType;
import com.therecommerce.workmap.workitem.domain.WorkItem;
import com.therecommerce.workmap.workitem.dto.WorkItemDtos;
import com.therecommerce.workmap.workitem.mapper.WorkItemLinkMapper;
import com.therecommerce.workmap.workitem.service.WorkItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

/**
 * 현장검증 기록 서비스(WMP-OPS-004, CR-012, 기획서 §10.2).
 *
 * <ul>
 *   <li>기록: 검증자/검증일/장소/환경/테스트내용/결과/발견이슈를 field_verifications에 저장.</li>
 *   <li>후속 업무: createFollowUp=true이고 발견 이슈가 있으면 후속 업무 항목 생성 +
 *       원본↔후속 RELATES_TO 양방향 링크(BIZ-109 — OperationsService.promoteToBacklog 동일 패턴).</li>
 * </ul>
 *
 * <p>상태 전이(현장검증형 DEV_DONE→FIELD_VERIFYING→OPS_APPLIED, T1-5)는 본 서비스가 하지 않는다 —
 * 기록 저장과 분리해 별도 FSM 전이(PATCH /status)로 처리(BIZ-010 직접 status UPDATE 금지).
 */
@Service
@RequiredArgsConstructor
public class VerificationService {

    private static final Set<String> VALID_RESULTS = Set.of("PASS", "FAIL", "PARTIAL");

    private final FieldVerificationMapper verificationMapper;
    private final WorkItemLinkMapper linkMapper;
    private final WorkItemService workItemService;

    /** 업무 항목별 현장검증 기록 목록(최신 먼저). */
    @Transactional(readOnly = true)
    public List<VerificationDtos.Response> list(Long workItemId) {
        workItemService.getEntity(workItemId);  // 없으면 WORK_ITEM_NOT_FOUND
        return verificationMapper.findByWorkItem(workItemId).stream()
                .map(VerificationDtos.Response::from).toList();
    }

    /** 현장검증 기록 + (옵션) 발견 이슈 후속 업무 생성. */
    @Transactional
    public VerificationDtos.CreateResult create(Long workItemId, VerificationDtos.CreateRequest req, Long actorId) {
        WorkItem origin = workItemService.getEntity(workItemId);  // 없으면 WORK_ITEM_NOT_FOUND

        String result = req.result() == null ? null : req.result().toUpperCase();
        if (!VALID_RESULTS.contains(result)) {
            throw new BusinessException(WmpErrorCode.FIELD_VERIFICATION_RESULT_INVALID);
        }

        FieldVerification v = FieldVerification.builder()
                .workItemId(workItemId)
                .verifier(req.verifier())
                .verifiedDate(req.verifiedDate())
                .location(req.location())
                .environment(req.environment())
                .testContent(req.testContent())
                .result(result)
                .issuesFound(req.issuesFound())
                .build();
        verificationMapper.insert(v);
        FieldVerification saved = verificationMapper.findById(v.getId());

        // 후속 업무 생성(발견 이슈가 있을 때만) — promoteToBacklog와 동일 패턴
        WorkItemDtos.Response followUp = null;
        boolean hasIssue = req.issuesFound() != null && !req.issuesFound().isBlank();
        if (req.createFollowUp() && hasIssue) {
            Long targetProjectId = req.followUpProjectId() != null
                    ? req.followUpProjectId() : origin.getProjectId();
            String issueType = req.followUpIssueType() != null
                    ? req.followUpIssueType() : IssueType.BUG.name();

            WorkItemDtos.CreateRequest create = new WorkItemDtos.CreateRequest(
                    targetProjectId, issueType, null, null,
                    "[현장검증] " + origin.getTitle(),
                    req.issuesFound(),               // 발견 이슈를 본문으로
                    origin.getPriority(), null, actorId, null,  // 백로그(sprintId=null), 미배정
                    null, null, null, null,
                    null, null, null, null,
                    null, null, null, null, null, null, null, null);
            followUp = workItemService.create(create, actorId);

            // 원본↔후속 RELATES_TO 양방향 링크(BIZ-109)
            linkMapper.insert(workItemId, followUp.id(), "RELATES_TO");
            linkMapper.insert(followUp.id(), workItemId, "RELATES_TO");
        }

        return new VerificationDtos.CreateResult(VerificationDtos.Response.from(saved), followUp);
    }
}
