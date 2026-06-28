package com.therecommerce.workmap.notification.listener;

import com.therecommerce.workmap.common.event.ApprovalEvents;
import com.therecommerce.workmap.common.event.SprintEvents;
import com.therecommerce.workmap.common.event.WorkItemEvents;
import com.therecommerce.workmap.member.mapper.ProjectMemberMapper;
import com.therecommerce.workmap.notification.domain.NotificationType;
import com.therecommerce.workmap.notification.service.NotificationDispatcher;
import com.therecommerce.workmap.workitem.domain.WorkItem;
import com.therecommerce.workmap.workitem.mapper.WorkItemMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * 알림 발행자(T1-6, CR-028 확장). 알림 유발 이벤트를 본 트랜잭션 커밋 후(AFTER_COMMIT) 비동기로
 * 소비하여 {@link NotificationDispatcher}(단일 진입점)로 넘긴다. Dispatcher가 인앱 기록 + 수신 설정
 * 확인 + 외부 fan-out을 담당한다.
 *
 * <p>인터페이스 바인딩 원칙: 발행 출처 서비스(WorkItem/Sprint/Approval)는 이 리스너를 모른다 —
 * 계약(이벤트+페이로드)만 보고 처리.
 *
 * <p>자기 액션 자기 알림 방지: 본인이 유발한 이벤트(자기 댓글/자기 상태변경)는 수신 대상에서 제외.
 */
@Component
@RequiredArgsConstructor
public class NotificationEventListener {

    private final NotificationDispatcher dispatcher;
    private final WorkItemMapper workItemMapper;
    private final ProjectMemberMapper projectMemberMapper;

    /** WorkItemAssigned → 신규 담당자에게 배정 알림. */
    @Async
    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onAssigned(WorkItemEvents.WorkItemAssigned event) {
        if (event.assigneeId() == null) {
            return;  // 미배정(BIZ-002) — 알림 없음
        }
        dispatcher.dispatch(event.assigneeId(), NotificationType.ASSIGNED,
                event.workItemId(), "업무가 배정되었습니다.");
    }

    /** WorkItemBlocked → 담당자 + 멘션 대상에게 막힘 알림. */
    @Async
    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onBlocked(WorkItemEvents.WorkItemBlocked event) {
        if (event.assigneeId() != null) {
            dispatcher.dispatch(event.assigneeId(), NotificationType.BLOCKED,
                    event.workItemId(), "업무가 막혔습니다: " + event.blockReason());
        }
        if (event.mentionedUserIds() != null) {
            event.mentionedUserIds().forEach(uid ->
                    dispatcher.dispatch(uid, NotificationType.BLOCKED,
                            event.workItemId(), "막힌 업무에 언급되었습니다."));
        }
    }

    /** WorkItemMentioned → 멘션 대상에게 알림(본인 멘션 제외). */
    @Async
    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onMentioned(WorkItemEvents.WorkItemMentioned event) {
        if (event.mentionedUserIds() == null) {
            return;
        }
        event.mentionedUserIds().stream()
                .filter(uid -> !uid.equals(event.authorId()))   // 자기 멘션 제외
                .forEach(uid -> dispatcher.dispatch(uid, NotificationType.MENTIONED,
                        event.workItemId(), "댓글에서 언급되었습니다."));
    }

    /** WorkItemCommented → 담당자에게 알림(본인이 단 댓글·미배정 제외). (CR-028) */
    @Async
    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onCommented(WorkItemEvents.WorkItemCommented event) {
        Long assignee = event.assigneeId();
        if (assignee == null || assignee.equals(event.authorId())) {
            return;  // 미배정 또는 본인 댓글 — 알림 없음
        }
        dispatcher.dispatch(assignee, NotificationType.COMMENTED,
                event.workItemId(), "담당 업무에 새 댓글이 달렸습니다.");
    }

    /** WorkItemStatusChanged → 담당자에게 알림(본인 변경 제외). (CR-028) */
    @Async
    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onStatusChanged(WorkItemEvents.WorkItemStatusChanged event) {
        WorkItem item = workItemMapper.findById(event.workItemId());
        if (item == null || item.getAssigneeId() == null
                || item.getAssigneeId().equals(event.changedBy())) {
            return;  // 미배정 또는 본인 변경 — 알림 없음
        }
        dispatcher.dispatch(item.getAssigneeId(), NotificationType.STATUS_CHANGED,
                event.workItemId(),
                "업무 상태가 " + event.toStatus() + "(으)로 변경되었습니다.");
    }

    /** SprintStarted → 프로젝트 멤버에게 알림(시작자 제외). (CR-028) */
    @Async
    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onSprintStarted(SprintEvents.SprintStarted event) {
        notifyProjectMembers(event.projectId(), event.startedBy(),
                NotificationType.SPRINT_STARTED, null, "스프린트가 시작되었습니다.");
    }

    /** SprintCompleted → 프로젝트 멤버에게 알림(완료자 제외). (CR-028) */
    @Async
    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onSprintCompleted(SprintEvents.SprintCompleted event) {
        notifyProjectMembers(event.projectId(), event.completedBy(),
                NotificationType.SPRINT_COMPLETED, null, "스프린트가 완료되었습니다.");
    }

    /**
     * ApprovalRequested → 승인자에게 알림. (CR-028)
     * 지정 승인자(approverId)가 있으면 그 사람에게, 없고 역할 기반(approverRole)이면 해당 역할
     * 프로젝트 멤버 전원에게 발행(요청자 본인 제외).
     */
    @Async
    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onApprovalRequested(ApprovalEvents.ApprovalRequested event) {
        String message = "승인 요청이 도착했습니다.";
        if (event.approverId() != null) {
            dispatcher.dispatch(event.approverId(), NotificationType.APPROVAL_REQUESTED,
                    event.workItemId(), message);
            return;
        }
        if (event.approverRole() == null) {
            return;  // 승인자 미지정·역할 미지정 — 대상 없음
        }
        WorkItem item = workItemMapper.findById(event.workItemId());
        if (item == null || item.getProjectId() == null) {
            return;
        }
        projectMemberMapper.findUserIdsByProjectAndRole(item.getProjectId(), event.approverRole())
                .stream()
                .filter(uid -> uid != null && !uid.equals(event.requestedBy()))
                .forEach(uid -> dispatcher.dispatch(uid, NotificationType.APPROVAL_REQUESTED,
                        event.workItemId(), message));
    }

    /** ApprovalDecided → 요청자에게 알림(본인 처리 제외). (CR-028) */
    @Async
    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onApprovalDecided(ApprovalEvents.ApprovalDecided event) {
        // 요청자(requestedBy)는 ApprovalRequested에만 있으므로 work_item 담당자에게 결과 통지.
        WorkItem item = workItemMapper.findById(event.workItemId());
        if (item == null || item.getAssigneeId() == null
                || item.getAssigneeId().equals(event.decidedBy())) {
            return;
        }
        String msg = "APPROVED".equals(event.decision())
                ? "승인 요청이 승인되었습니다." : "승인 요청이 반려되었습니다.";
        dispatcher.dispatch(item.getAssigneeId(), NotificationType.APPROVAL_DECIDED,
                event.workItemId(), msg);
    }

    /** 프로젝트 멤버 전원에게 발행(액터 본인 제외). */
    private void notifyProjectMembers(Long projectId, Long actorId,
                                      NotificationType type, Long workItemId, String message) {
        if (projectId == null) {
            return;
        }
        projectMemberMapper.findByProjectId(projectId).stream()
                .map(m -> m.userId())
                .filter(uid -> uid != null && !uid.equals(actorId))
                .forEach(uid -> dispatcher.dispatch(uid, type, workItemId, message));
    }
}
