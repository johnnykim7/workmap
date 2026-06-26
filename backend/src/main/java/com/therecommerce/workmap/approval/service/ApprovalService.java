package com.therecommerce.workmap.approval.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.approval.domain.Approval;
import com.therecommerce.workmap.approval.domain.Decision;
import com.therecommerce.workmap.approval.dto.ApprovalDtos;
import com.therecommerce.workmap.approval.mapper.ApprovalMapper;
import com.therecommerce.workmap.common.event.ApprovalEvents;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.member.mapper.ProjectMemberMapper;
import com.therecommerce.workmap.project.mapper.ProjectMapper;
import com.therecommerce.workmap.workitem.domain.WorkItem;
import com.therecommerce.workmap.workitem.dto.WorkItemDtos;
import com.therecommerce.workmap.workitem.mapper.WorkItemMapper;
import com.therecommerce.workmap.workitem.service.WorkItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * 승인 처리 서비스(WMP-OPS-006). 게이트 진입 자동 생성은 {@link ApprovalGate}가 담당하고,
 * 본 서비스는 승인/거부 결정과 그에 따른 work_item 상태 전이(전진/반려)를 처리한다.
 *
 * <ul>
 *   <li>권한(APR-3, BIZ-111): approverId 지정 시 그 사용자만, role 지정 시 프로젝트 내 해당 역할만.</li>
 *   <li>APPROVE(APR-4): 같은 게이트의 모든 승인이 APPROVED면 nextStatusId로 전이(POL-011 다수 승인).</li>
 *   <li>REJECT(APR-5): rejectStatusId로 반려 전이 + 사유.</li>
 *   <li>이벤트(APR-8): ApprovalDecided 발행.</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
public class ApprovalService {

    private final ApprovalMapper approvalMapper;
    private final ProjectMemberMapper memberMapper;
    private final ProjectMapper projectMapper;
    private final WorkItemMapper workItemMapper;
    private final WorkItemService workItemService;
    private final ApplicationEventPublisher events;
    private final Clock clock;

    @Transactional(readOnly = true)
    public List<ApprovalDtos.Response> listByProject(Long projectId, String decision) {
        if (projectMapper.findById(projectId) == null) {
            throw new BusinessException(WmpErrorCode.PROJECT_NOT_FOUND);
        }
        return approvalMapper.findByProject(projectId, decision).stream()
                .map(ApprovalDtos.Response::from).toList();
    }

    @Transactional(readOnly = true)
    public List<ApprovalDtos.Response> listByWorkItem(Long workItemId) {
        return approvalMapper.findByWorkItem(workItemId).stream()
                .map(ApprovalDtos.Response::from).toList();
    }

    /** 승인/거부 처리(APR-3/4/5/6/8). */
    @Transactional
    public ApprovalDtos.Response decide(Long approvalId, ApprovalDtos.DecisionRequest req, Long actorId) {
        Approval approval = approvalMapper.findById(approvalId);
        if (approval == null) {
            throw new BusinessException(WmpErrorCode.APPROVAL_NOT_FOUND);
        }
        if (!Decision.PENDING.name().equals(approval.getDecision())) {
            throw new BusinessException(WmpErrorCode.APPROVAL_ALREADY_DECIDED);   // 재처리 방지
        }

        WorkItem work = workItemMapper.findById(approval.getWorkItemId());
        if (work == null) {
            throw new BusinessException(WmpErrorCode.WORK_ITEM_NOT_FOUND);
        }
        assertAuthorizedApprover(approval, work.getProjectId(), actorId);          // APR-3, BIZ-111

        boolean approve = "APPROVE".equalsIgnoreCase(req.decision());
        boolean reject = "REJECT".equalsIgnoreCase(req.decision());
        if (!approve && !reject) {
            throw new BusinessException(WmpErrorCode.INVALID_REQUEST, "decision은 APPROVE 또는 REJECT 여야 합니다.");
        }

        OffsetDateTime now = OffsetDateTime.now(clock);
        String decision = approve ? Decision.APPROVED.name() : Decision.REJECTED.name();
        approvalMapper.updateDecision(approvalId, decision, req.comment(), actorId, now);

        // ApprovalDecided 발행(APR-8)
        events.publishEvent(new ApprovalEvents.ApprovalDecided(
                approvalId, approval.getWorkItemId(), decision, actorId, req.comment(), now));

        if (reject) {
            // 반려 전이(APR-5): rejectStatusId가 있으면 그 상태로(사유=comment)
            if (req.rejectStatusId() != null) {
                workItemService.changeStatus(approval.getWorkItemId(),
                        new WorkItemDtos.ChangeStatusRequest(req.rejectStatusId(), req.comment()),
                        actorId, true);   // bypassApproval: 게이트의 PENDING 차단 우회(이미 결정됨)
            }
        } else {
            // 다수 승인(APR-6, POL-011): 같은 게이트의 모든 승인이 APPROVED일 때만 전진
            boolean allApproved = approvalMapper
                    .findByWorkItemAndStatus(approval.getWorkItemId(), approval.getStatusId())
                    .stream()
                    .allMatch(a -> Decision.APPROVED.name().equals(a.getDecision()));
            if (allApproved && req.nextStatusId() != null) {
                workItemService.changeStatus(approval.getWorkItemId(),
                        new WorkItemDtos.ChangeStatusRequest(req.nextStatusId(), null),
                        actorId, true);   // bypassApproval: 게이트 통과(APR-4)
            }
        }

        return ApprovalDtos.Response.from(approvalMapper.findById(approvalId));
    }

    /** 승인 권한 검증(APR-3, BIZ-111): 지정 승인자 또는 지정 역할만 처리 가능. */
    private void assertAuthorizedApprover(Approval approval, Long projectId, Long actorId) {
        if (approval.getApproverId() != null) {
            if (!approval.getApproverId().equals(actorId)) {
                throw new BusinessException(WmpErrorCode.NOT_AUTHORIZED_APPROVER);
            }
            return;
        }
        if (approval.getApproverRole() != null) {
            String role = memberMapper.findRole(projectId, actorId);
            if (role == null || !approval.getApproverRole().equalsIgnoreCase(role)) {
                throw new BusinessException(WmpErrorCode.NOT_AUTHORIZED_APPROVER);
            }
        }
        // approverId/approverRole 둘 다 없으면 게이트에 승인자 지정이 없는 것 — 멤버면 처리 가능(기본 허용)
    }
}
