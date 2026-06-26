package com.therecommerce.workmap.approval.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.approval.domain.Approval;
import com.therecommerce.workmap.approval.domain.Decision;
import com.therecommerce.workmap.approval.mapper.ApprovalMapper;
import com.therecommerce.workmap.common.event.ApprovalEvents;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.workflow.domain.WorkflowStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;

/**
 * 승인 게이트 저수준 훅(WMP-OPS-006). work_item 상태 전이(WorkItemService.changeStatus) 안에서 호출된다.
 *
 * <ul>
 *   <li>{@link #assertNotPending}: 승인 게이트 상태(is_approval)에서 다음 상태로 전이 시도 시,
 *       PENDING 승인이 남아있으면 차단(APR-2, BIZ-110).</li>
 *   <li>{@link #onEnterGate}: 게이트 상태에 진입하면 PENDING 승인 행 생성 + ApprovalRequested 발행(APR-1/7).</li>
 * </ul>
 *
 * <p>WorkItemService와 ApprovalService 간 순환 의존을 끊기 위해 게이트 훅을 별도 빈으로 분리한다.
 */
@Component
@RequiredArgsConstructor
public class ApprovalGate {

    private final ApprovalMapper approvalMapper;
    private final ApplicationEventPublisher events;

    /**
     * 승인 게이트 상태에서 다음 상태로 빠져나갈 때, 미완료(PENDING) 승인이 있으면 차단(APR-2, BIZ-110).
     * from이 승인 게이트가 아니거나, 승인 결과로 진행하는 경우(bypassApproved=true)는 통과.
     */
    public void assertCanLeave(WorkflowStatus from, Long workItemId, boolean bypassApproved) {
        if (from == null || !from.isApproval() || bypassApproved) {
            return;
        }
        int pending = approvalMapper.countPendingByWorkItemAndStatus(workItemId, from.getId());
        if (pending > 0) {
            throw new BusinessException(WmpErrorCode.APPROVAL_PENDING);
        }
    }

    /** 승인 게이트 상태(is_approval) 진입 시 PENDING 승인 행 생성 + ApprovalRequested 발행(APR-1/7). */
    public void onEnterGate(WorkflowStatus to, Long workItemId, Long requestedBy, OffsetDateTime now) {
        if (to == null || !to.isApproval()) {
            return;
        }
        Approval approval = Approval.builder()
                .workItemId(workItemId)
                .statusId(to.getId())
                .requestedBy(requestedBy)
                .approverRole(to.getApproverRole())   // 역할 기반 승인자(지정 사용자 미사용 시)
                .decision(Decision.PENDING.name())
                .build();
        approvalMapper.insert(approval);

        events.publishEvent(new ApprovalEvents.ApprovalRequested(
                approval.getId(), workItemId, to.getId(),
                approval.getApproverId(), approval.getApproverRole(), requestedBy, now));
    }
}
