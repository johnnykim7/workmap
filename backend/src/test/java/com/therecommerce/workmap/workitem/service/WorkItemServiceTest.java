package com.therecommerce.workmap.workitem.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.common.event.WorkItemEvents;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.measure.domain.MeasureUnit;
import com.therecommerce.workmap.measure.mapper.MeasureUnitMapper;
import com.therecommerce.workmap.member.mapper.ProjectMemberMapper;
import com.therecommerce.workmap.project.domain.Project;
import com.therecommerce.workmap.project.mapper.ProjectMapper;
import com.therecommerce.workmap.workitem.domain.ActivityLog;
import com.therecommerce.workmap.workitem.domain.WorkItem;
import com.therecommerce.workmap.workitem.dto.WorkItemDtos;
import com.therecommerce.workmap.workitem.mapper.ActivityLogMapper;
import com.therecommerce.workmap.workitem.mapper.WorkItemMapper;
import com.therecommerce.workmap.workflow.domain.WorkflowStatus;
import com.therecommerce.workmap.workflow.mapper.WorkflowMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.*;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * WorkItemService 단위테스트 (T3-5 Sprint 3: WI / HRC / CVT / FSM / MSR / ASG / AGG).
 * Clock은 고정 시각으로 Mock(완료/측정 시각 검증). 이벤트는 ApplicationEventPublisher Mock으로 검증.
 */
@ExtendWith(MockitoExtension.class)
class WorkItemServiceTest {

    @Mock WorkItemMapper workItemMapper;
    @Mock WorkflowMapper workflowMapper;
    @Mock ProjectMapper projectMapper;
    @Mock ProjectMemberMapper memberMapper;
    @Mock MeasureUnitMapper measureUnitMapper;
    @Mock ActivityLogMapper activityLogMapper;
    @Mock com.therecommerce.workmap.approval.service.ApprovalGate approvalGate;
    @Mock org.springframework.context.ApplicationEventPublisher events;

    WorkItemService service;

    static final OffsetDateTime FIXED = OffsetDateTime.of(2026, 6, 26, 10, 0, 0, 0, ZoneOffset.UTC);
    Clock fixedClock = Clock.fixed(FIXED.toInstant(), ZoneOffset.UTC);

    @BeforeEach
    void setUp() {
        service = new WorkItemService(workItemMapper, workflowMapper, projectMapper, memberMapper,
                measureUnitMapper, activityLogMapper, approvalGate, events, fixedClock);
    }

    // ── 픽스처 ──
    private Project devProject() {
        return Project.builder().id(5L).key("ZGOH").workflowId(10L)
                .visibility("PUBLIC").createdBy(99L).build();
    }

    private WorkflowStatus status(long id, String code, String common, boolean start, boolean done) {
        return WorkflowStatus.builder().id(id).workflowId(10L).code(code)
                .commonStatus(common).isStart(start).isDone(done).build();
    }

    private WorkItem item(long id, long statusId, String common) {
        return WorkItem.builder().id(id).key("ZGOH-1").projectId(5L).issueType("TASK")
                .workflowId(10L).statusId(statusId).commonStatus(common).priority("NORMAL")
                .progress(0).createdBy(99L).createdAt(FIXED).build();
    }

    private WorkItemDtos.CreateRequest createReq(String type, Long parentId) {
        return new WorkItemDtos.CreateRequest(5L, type, parentId, null, "제목", null, null, null, null,
                null, null, null, null, null, null, null, null, null, null, null, null, null, null,
                null, null, null);
    }

    // ===================================================================
    // WI — 생성/CRUD
    // ===================================================================

    @Test
    @DisplayName("WI-1: 프로젝트미지정_생성_거부(BIZ-001)")
    void 프로젝트미지정_생성_거부() {
        WorkItemDtos.CreateRequest req = new WorkItemDtos.CreateRequest(
                null, "TASK", null, null, "제목", null, null, null, null, null, null, null, null, null,
                null, null, null, null, null, null, null, null, null, null, null, null);
        assertThatThrownBy(() -> service.create(req, 99L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.PROJECT_REQUIRED);
    }

    @Test
    @DisplayName("WI-2: 담당자미배정_생성_허용(BIZ-002 v0.4)")
    void 담당자미배정_생성_허용() {
        when(projectMapper.findById(5L)).thenReturn(devProject());
        when(workflowMapper.findStartStatus(10L)).thenReturn(status(100, "TODO", "TODO", true, false));
        when(workItemMapper.nextSeq(5L)).thenReturn(1);
        when(workItemMapper.findById(any())).thenReturn(item(1L, 100L, "TODO"));

        WorkItemDtos.Response res = service.create(createReq("TASK", null), 99L);

        assertThat(res).isNotNull();
        verify(workItemMapper).insert(any());  // 미배정이어도 생성 성공
    }

    @Test
    @DisplayName("WI-3: 생성시상태_시작상태로고정(BIZ-101, common_status=TODO)")
    void 생성시상태_시작상태고정() {
        when(projectMapper.findById(5L)).thenReturn(devProject());
        when(workflowMapper.findStartStatus(10L)).thenReturn(status(100, "TODO", "TODO", true, false));
        when(workItemMapper.nextSeq(5L)).thenReturn(1);
        when(workItemMapper.findById(any())).thenReturn(item(1L, 100L, "TODO"));

        service.create(createReq("TASK", null), 99L);

        ArgumentCaptor<WorkItem> c = ArgumentCaptor.forClass(WorkItem.class);
        verify(workItemMapper).insert(c.capture());
        assertThat(c.getValue().getStatusId()).isEqualTo(100L);
        assertThat(c.getValue().getCommonStatus()).isEqualTo("TODO");
    }

    @Test
    @DisplayName("WI-4: key자동발급_프로젝트순번(seq=4 → ZGOH-5)")
    void key자동발급_순번() {
        when(projectMapper.findById(5L)).thenReturn(devProject());
        when(workflowMapper.findStartStatus(10L)).thenReturn(status(100, "TODO", "TODO", true, false));
        when(workItemMapper.nextSeq(5L)).thenReturn(5);  // seq_counter 증가 후 5
        when(workItemMapper.findById(any())).thenReturn(item(1L, 100L, "TODO"));

        service.create(createReq("TASK", null), 99L);

        ArgumentCaptor<WorkItem> c = ArgumentCaptor.forClass(WorkItem.class);
        verify(workItemMapper).insert(c.capture());
        assertThat(c.getValue().getKey()).isEqualTo("ZGOH-5");
    }

    @Test
    @DisplayName("WI-5: start>due_생성_거부(BIZ-007)")
    void 시작일종료일역전_거부() {
        when(projectMapper.findById(5L)).thenReturn(devProject());
        WorkItemDtos.CreateRequest req = new WorkItemDtos.CreateRequest(
                5L, "TASK", null, null, "제목", null, null, null, null, null, null, null,
                LocalDate.of(2026, 6, 10), LocalDate.of(2026, 6, 1),
                null, null, null, null, null, null, null, null, null, null, null, null);
        assertThatThrownBy(() -> service.create(req, 99L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.INVALID_REQUEST);
    }

    @Test
    @DisplayName("WI-6: 소프트삭제_deletedAt설정 + 자식 함께 처리")
    void 소프트삭제_자식포함() {
        when(workItemMapper.findById(1L)).thenReturn(item(1L, 100L, "TODO"));
        service.softDelete(1L, 99L);
        verify(workItemMapper).softDeleteChildren(eq(1L), any());
        verify(workItemMapper).softDelete(eq(1L), any());
    }

    @Test
    @DisplayName("WI-7: 생성완료_WorkItemCreated발행")
    void 생성_이벤트발행() {
        when(projectMapper.findById(5L)).thenReturn(devProject());
        when(workflowMapper.findStartStatus(10L)).thenReturn(status(100, "TODO", "TODO", true, false));
        when(workItemMapper.nextSeq(5L)).thenReturn(1);
        when(workItemMapper.findById(any())).thenReturn(item(1L, 100L, "TODO"));

        service.create(createReq("TASK", null), 99L);

        ArgumentCaptor<Object> ev = ArgumentCaptor.forClass(Object.class);
        verify(events).publishEvent(ev.capture());
        assertThat(ev.getValue()).isInstanceOf(WorkItemEvents.WorkItemCreated.class);
        WorkItemEvents.WorkItemCreated c = (WorkItemEvents.WorkItemCreated) ev.getValue();
        assertThat(c.workItemId()).isEqualTo(1L);
        assertThat(c.projectId()).isEqualTo(5L);
        assertThat(c.issueType()).isEqualTo("TASK");
        assertThat(c.createdBy()).isEqualTo(99L);
    }

    // ===================================================================
    // HRC — 계층 정합성 (BIZ-103)
    // ===================================================================

    @Test
    @DisplayName("HRC-1: Sub태스크_부모없이생성_거부")
    void 서브태스크_부모없음_거부() {
        when(projectMapper.findById(5L)).thenReturn(devProject());
        assertThatThrownBy(() -> service.create(createReq("SUBTASK", null), 99L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.HIERARCHY_VIOLATION);
    }

    @Test
    @DisplayName("HRC-2: Epic을Sub태스크부모로_거부")
    void 에픽을_서브태스크부모로_거부() {
        when(projectMapper.findById(5L)).thenReturn(devProject());
        WorkItem epic = WorkItem.builder().id(7L).issueType("EPIC").build();
        when(workItemMapper.findById(7L)).thenReturn(epic);
        assertThatThrownBy(() -> service.create(createReq("SUBTASK", 7L), 99L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.HIERARCHY_VIOLATION);
    }

    @Test
    @DisplayName("HRC-3: depth3초과_거부(Sub-task 아래 Sub-task)")
    void depth초과_거부() {
        when(projectMapper.findById(5L)).thenReturn(devProject());
        WorkItem subParent = WorkItem.builder().id(8L).issueType("SUBTASK").build();
        when(workItemMapper.findById(8L)).thenReturn(subParent);
        assertThatThrownBy(() -> service.create(createReq("SUBTASK", 8L), 99L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.HIERARCHY_VIOLATION);
    }

    @Test
    @DisplayName("HRC-5: Story정상생성_Epic연결")
    void 스토리_에픽연결_성공() {
        when(projectMapper.findById(5L)).thenReturn(devProject());
        when(workflowMapper.findStartStatus(10L)).thenReturn(status(100, "TODO", "TODO", true, false));
        when(workItemMapper.nextSeq(5L)).thenReturn(1);
        when(workItemMapper.findById(any())).thenReturn(item(1L, 100L, "TODO"));

        WorkItemDtos.CreateRequest req = new WorkItemDtos.CreateRequest(
                5L, "STORY", null, 7L, "스토리", null, null, null, null, null, null, null, null, null,
                null, null, null, null, null, null, null, null, null, null, null, null);
        service.create(req, 99L);

        ArgumentCaptor<WorkItem> c = ArgumentCaptor.forClass(WorkItem.class);
        verify(workItemMapper).insert(c.capture());
        assertThat(c.getValue().getEpicId()).isEqualTo(7L);
    }

    @Test
    @DisplayName("HRC-6: Sub태스크생성API_부모하위로(depth=2)")
    void 서브태스크API_부모하위생성() {
        WorkItem story = WorkItem.builder().id(2L).projectId(5L).issueType("STORY").build();
        when(projectMapper.findById(5L)).thenReturn(devProject());
        when(workflowMapper.findStartStatus(10L)).thenReturn(status(100, "TODO", "TODO", true, false));
        when(workItemMapper.nextSeq(5L)).thenReturn(3);
        // getEntity(부모) → 계층검증(부모 재조회) → 생성 후 findById
        when(workItemMapper.findById(2L)).thenReturn(story);
        when(workItemMapper.findById(9L)).thenReturn(item(9L, 100L, "TODO"));

        WorkItemDtos.CreateSubtaskRequest req = new WorkItemDtos.CreateSubtaskRequest(
                "하위", null, null, null, null, null);
        // insert 시 생성 id 부여(이후 findById(9L)로 조회)
        doAnswer(inv -> { ((WorkItem) inv.getArgument(0)).setId(9L); return null; })
                .when(workItemMapper).insert(any());
        service.createSubtask(2L, req, 99L);

        ArgumentCaptor<WorkItem> c = ArgumentCaptor.forClass(WorkItem.class);
        verify(workItemMapper).insert(c.capture());
        assertThat(c.getValue().getIssueType()).isEqualTo("SUBTASK");
        assertThat(c.getValue().getParentId()).isEqualTo(2L);
    }

    // ===================================================================
    // CVT — 유형 전환 (WMP-WI-014)
    // ===================================================================

    @Test
    @DisplayName("CVT-1: Task를Story로전환_성공_미사용필드보존")
    void 유형전환_TASK_STORY_성공() {
        WorkItem task = item(1L, 100L, "TODO");
        task.setChecklist("[{\"text\":\"a\",\"done\":false}]");  // 미사용 필드(보존 대상)
        when(workItemMapper.findById(1L)).thenReturn(task);

        WorkItemDtos.ConvertRequest req = new WorkItemDtos.ConvertRequest("STORY", null, null);
        service.convert(1L, req, 99L);

        ArgumentCaptor<WorkItem> c = ArgumentCaptor.forClass(WorkItem.class);
        verify(workItemMapper).updateType(c.capture());
        assertThat(c.getValue().getIssueType()).isEqualTo("STORY");
        assertThat(c.getValue().getChecklist()).isEqualTo("[{\"text\":\"a\",\"done\":false}]");  // 보존
    }

    @Test
    @DisplayName("CVT-2: 계층위반전환_거부(Story→Sub-task, 부모 없음)")
    void 유형전환_계층위반_거부() {
        WorkItem story = item(1L, 100L, "TODO");
        story.setIssueType("STORY");
        story.setParentId(null);
        when(workItemMapper.findById(1L)).thenReturn(story);

        WorkItemDtos.ConvertRequest req = new WorkItemDtos.ConvertRequest("SUBTASK", null, null);
        assertThatThrownBy(() -> service.convert(1L, req, 99L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.HIERARCHY_VIOLATION);
        verify(workItemMapper, never()).updateType(any());
    }

    @Test
    @DisplayName("CVT-3: 유형전환_TYPE_CONVERT이력")
    void 유형전환_이력기록() {
        when(workItemMapper.findById(1L)).thenReturn(item(1L, 100L, "TODO"));
        service.convert(1L, new WorkItemDtos.ConvertRequest("STORY", null, null), 99L);

        ArgumentCaptor<ActivityLog> c = ArgumentCaptor.forClass(ActivityLog.class);
        verify(activityLogMapper).insert(c.capture());
        assertThat(c.getValue().getAction()).isEqualTo(ActivityLog.TYPE_CONVERT);
        assertThat(c.getValue().getFromValue()).isEqualTo("TASK");
        assertThat(c.getValue().getToValue()).isEqualTo("STORY");
    }

    // ===================================================================
    // FSM — 상태 전이 (BIZ-010 핵심)
    // ===================================================================

    @Test
    @DisplayName("FSM-1: 허용전이_성공(IN_PROGRESS→IN_REVIEW)")
    void 허용전이_성공() {
        WorkItem w = item(1L, 102L, "IN_PROGRESS");
        when(workItemMapper.findById(1L)).thenReturn(w);
        when(workflowMapper.findStatusById(102L)).thenReturn(status(102, "IN_PROGRESS", "IN_PROGRESS", false, false));
        when(workflowMapper.findStatusById(103L)).thenReturn(status(103, "IN_REVIEW", "IN_REVIEW", false, false));
        when(workflowMapper.transitionExists(10L, 102L, 103L)).thenReturn(true);

        service.changeStatus(1L, new WorkItemDtos.ChangeStatusRequest(103L), 99L);

        ArgumentCaptor<WorkItem> c = ArgumentCaptor.forClass(WorkItem.class);
        verify(workItemMapper).updateStatus(c.capture());
        assertThat(c.getValue().getStatusId()).isEqualTo(103L);
        assertThat(c.getValue().getCommonStatus()).isEqualTo("IN_REVIEW");
        assertThat(c.getValue().getStatusChangedAt()).isEqualTo(FIXED);
    }

    @Test
    @DisplayName("FSM-2: 금지전이_거부(TODO→DONE, 화이트리스트에 없음)")
    void 금지전이_거부() {
        WorkItem w = item(1L, 100L, "TODO");
        when(workItemMapper.findById(1L)).thenReturn(w);
        when(workflowMapper.findStatusById(100L)).thenReturn(status(100, "TODO", "TODO", true, false));
        when(workflowMapper.findStatusById(104L)).thenReturn(status(104, "DONE", "DONE", false, true));
        when(workflowMapper.transitionExists(10L, 100L, 104L)).thenReturn(false);

        assertThatThrownBy(() -> service.changeStatus(1L, new WorkItemDtos.ChangeStatusRequest(104L), 99L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.TRANSITION_NOT_ALLOWED);
        verify(workItemMapper, never()).updateStatus(any());
    }

    @Test
    @DisplayName("FLAG-1: 막힘표시_사유없음_거부(BIZ-005, CR-040)")
    void 막힘표시_사유없음_거부() {
        WorkItem w = item(1L, 102L, "IN_PROGRESS");
        when(workItemMapper.findById(1L)).thenReturn(w);

        assertThatThrownBy(() -> service.toggleFlag(1L, new WorkItemDtos.FlagRequest(true, "  "), 99L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.BLOCK_REASON_REQUIRED);
    }

    @Test
    @DisplayName("FLAG-2: 막힘표시_성공_상태불변_flagged와사유저장(CR-040)")
    void 막힘표시_성공_상태불변() {
        WorkItem w = item(1L, 102L, "IN_PROGRESS");
        when(workItemMapper.findById(1L)).thenReturn(w);

        service.toggleFlag(1L, new WorkItemDtos.FlagRequest(true, "API 막힘"), 99L);

        ArgumentCaptor<WorkItem> c = ArgumentCaptor.forClass(WorkItem.class);
        verify(workItemMapper).updateFlag(c.capture());
        assertThat(c.getValue().isFlagged()).isTrue();
        assertThat(c.getValue().getBlockReason()).isEqualTo("API 막힘");
        assertThat(c.getValue().getCommonStatus()).isEqualTo("IN_PROGRESS"); // 상태 불변
        verify(workItemMapper, never()).updateStatus(any());
    }

    @Test
    @DisplayName("FLAG-3: 막힘해제_즉시_flagged와사유제거_이벤트미발행(CR-040)")
    void 막힘해제_즉시() {
        WorkItem w = item(1L, 102L, "IN_PROGRESS");
        w.setFlagged(true);
        w.setBlockReason("이전 막힘");
        when(workItemMapper.findById(1L)).thenReturn(w);

        service.toggleFlag(1L, new WorkItemDtos.FlagRequest(false, null), 99L);

        ArgumentCaptor<WorkItem> c = ArgumentCaptor.forClass(WorkItem.class);
        verify(workItemMapper).updateFlag(c.capture());
        assertThat(c.getValue().isFlagged()).isFalse();
        assertThat(c.getValue().getBlockReason()).isNull();
        // 해제 시엔 WorkItemBlocked 미발행
        verify(events, never()).publishEvent(any(WorkItemEvents.WorkItemBlocked.class));
    }

    @Test
    @DisplayName("FSM-6: DONE전이_completedAt자동(Clock Mock)")
    void 완료전이_completedAt자동() {
        WorkItem w = item(1L, 103L, "IN_REVIEW");
        when(workItemMapper.findById(1L)).thenReturn(w);
        when(workflowMapper.findStatusById(103L)).thenReturn(status(103, "IN_REVIEW", "IN_REVIEW", false, false));
        when(workflowMapper.findStatusById(104L)).thenReturn(status(104, "DONE", "DONE", false, true));
        when(workflowMapper.transitionExists(10L, 103L, 104L)).thenReturn(true);

        service.changeStatus(1L, new WorkItemDtos.ChangeStatusRequest(104L), 99L);

        ArgumentCaptor<WorkItem> c = ArgumentCaptor.forClass(WorkItem.class);
        verify(workItemMapper).updateStatus(c.capture());
        assertThat(c.getValue().getCompletedAt()).isEqualTo(FIXED);
        assertThat(c.getValue().getCommonStatus()).isEqualTo("DONE");
    }

    @Test
    @DisplayName("FSM-7: 재오픈_completedAt null복원(DONE→IN_PROGRESS)")
    void 재오픈_completedAt복원() {
        WorkItem w = item(1L, 104L, "DONE");
        w.setCompletedAt(FIXED);
        when(workItemMapper.findById(1L)).thenReturn(w);
        when(workflowMapper.findStatusById(104L)).thenReturn(status(104, "DONE", "DONE", false, true));
        when(workflowMapper.findStatusById(102L)).thenReturn(status(102, "IN_PROGRESS", "IN_PROGRESS", false, false));
        when(workflowMapper.transitionExists(10L, 104L, 102L)).thenReturn(true);

        service.changeStatus(1L, new WorkItemDtos.ChangeStatusRequest(102L), 99L);

        ArgumentCaptor<WorkItem> c = ArgumentCaptor.forClass(WorkItem.class);
        verify(workItemMapper).updateStatus(c.capture());
        assertThat(c.getValue().getCompletedAt()).isNull();
    }

    @Test
    @DisplayName("FSM-9: 운영형금지전이_거부(RECEIVED→DONE)")
    void 운영형_금지전이_거부() {
        WorkItem w = item(1L, 200L, "TODO");
        when(workItemMapper.findById(1L)).thenReturn(w);
        when(workflowMapper.findStatusById(200L)).thenReturn(status(200, "RECEIVED", "TODO", true, false));
        when(workflowMapper.findStatusById(205L)).thenReturn(status(205, "DONE", "DONE", false, true));
        when(workflowMapper.transitionExists(10L, 200L, 205L)).thenReturn(false);

        assertThatThrownBy(() -> service.changeStatus(1L, new WorkItemDtos.ChangeStatusRequest(205L), 99L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.TRANSITION_NOT_ALLOWED);
    }

    @Test
    @DisplayName("FSM-10: 상태전이_WorkItemStatusChanged발행")
    void 상태전이_이벤트발행() {
        WorkItem w = item(1L, 102L, "IN_PROGRESS");
        when(workItemMapper.findById(1L)).thenReturn(w);
        when(workflowMapper.findStatusById(102L)).thenReturn(status(102, "IN_PROGRESS", "IN_PROGRESS", false, false));
        when(workflowMapper.findStatusById(103L)).thenReturn(status(103, "IN_REVIEW", "IN_REVIEW", false, false));
        when(workflowMapper.transitionExists(10L, 102L, 103L)).thenReturn(true);

        service.changeStatus(1L, new WorkItemDtos.ChangeStatusRequest(103L), 99L);

        ArgumentCaptor<Object> ev = ArgumentCaptor.forClass(Object.class);
        verify(events).publishEvent(ev.capture());
        WorkItemEvents.WorkItemStatusChanged e = (WorkItemEvents.WorkItemStatusChanged) ev.getValue();
        assertThat(e.fromStatus()).isEqualTo("IN_PROGRESS");
        assertThat(e.toStatus()).isEqualTo("IN_REVIEW");
        assertThat(e.changedBy()).isEqualTo(99L);
        assertThat(e.changedAt()).isEqualTo(FIXED);
    }

    @Test
    @DisplayName("FLAG-4: 막힘표시_WorkItemBlocked발행_담당자전파(CR-040)")
    void 막힘표시_이벤트발행() {
        WorkItem w = item(1L, 102L, "IN_PROGRESS");
        w.setAssigneeId(42L);
        when(workItemMapper.findById(1L)).thenReturn(w);

        service.toggleFlag(1L, new WorkItemDtos.FlagRequest(true, "막힘 사유"), 99L);

        ArgumentCaptor<Object> ev = ArgumentCaptor.forClass(Object.class);
        verify(events).publishEvent(ev.capture());  // WorkItemBlocked 1건(상태 전이 없음)
        WorkItemEvents.WorkItemBlocked blocked = ev.getAllValues().stream()
                .filter(o -> o instanceof WorkItemEvents.WorkItemBlocked)
                .map(o -> (WorkItemEvents.WorkItemBlocked) o).findFirst().orElseThrow();
        assertThat(blocked.blockReason()).isEqualTo("막힘 사유");
        assertThat(blocked.blockedBy()).isEqualTo(99L);
        assertThat(blocked.assigneeId()).isEqualTo(42L);
    }

    @Test
    @DisplayName("FSM-12: 상태전이_STATUS_CHANGE이력")
    void 상태전이_이력기록() {
        WorkItem w = item(1L, 102L, "IN_PROGRESS");
        when(workItemMapper.findById(1L)).thenReturn(w);
        when(workflowMapper.findStatusById(102L)).thenReturn(status(102, "IN_PROGRESS", "IN_PROGRESS", false, false));
        when(workflowMapper.findStatusById(103L)).thenReturn(status(103, "IN_REVIEW", "IN_REVIEW", false, false));
        when(workflowMapper.transitionExists(10L, 102L, 103L)).thenReturn(true);

        service.changeStatus(1L, new WorkItemDtos.ChangeStatusRequest(103L), 99L);

        ArgumentCaptor<ActivityLog> c = ArgumentCaptor.forClass(ActivityLog.class);
        verify(activityLogMapper).insert(c.capture());
        assertThat(c.getValue().getAction()).isEqualTo(ActivityLog.STATUS_CHANGE);
        assertThat(c.getValue().getFromValue()).isEqualTo("IN_PROGRESS");
        assertThat(c.getValue().getToValue()).isEqualTo("IN_REVIEW");
    }

    // ===================================================================
    // ASG — 담당자
    // ===================================================================

    @Test
    @DisplayName("ASG-1: 담당자변경_저장_WorkItemAssigned발행")
    void 담당자변경_이벤트발행() {
        WorkItem w = item(1L, 100L, "TODO");
        w.setAssigneeId(11L);
        when(workItemMapper.findById(1L)).thenReturn(w);
        when(projectMapper.findById(5L)).thenReturn(devProject());

        service.changeAssignee(1L, new WorkItemDtos.ChangeAssigneeRequest(22L, null), 99L);

        verify(workItemMapper).updateAssignee(1L, 22L, null);
        ArgumentCaptor<Object> ev = ArgumentCaptor.forClass(Object.class);
        verify(events).publishEvent(ev.capture());
        WorkItemEvents.WorkItemAssigned e = (WorkItemEvents.WorkItemAssigned) ev.getValue();
        assertThat(e.assigneeId()).isEqualTo(22L);
        assertThat(e.previousAssigneeId()).isEqualTo(11L);
        assertThat(e.assignedBy()).isEqualTo(99L);
    }

    @Test
    @DisplayName("ASG-2: 비멤버담당자지정_거부(비공개 프로젝트, BIZ-108)")
    void 비공개_비멤버담당자_거부() {
        WorkItem w = item(1L, 100L, "TODO");
        when(workItemMapper.findById(1L)).thenReturn(w);
        Project priv = Project.builder().id(5L).key("ZGOH").visibility("PRIVATE").createdBy(99L).build();
        when(projectMapper.findById(5L)).thenReturn(priv);
        when(memberMapper.exists(5L, 22L)).thenReturn(false);

        assertThatThrownBy(() -> service.changeAssignee(1L, new WorkItemDtos.ChangeAssigneeRequest(22L, null), 99L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.NOT_PROJECT_MEMBER);
        verify(workItemMapper, never()).updateAssignee(any(), any(), any());
    }

    // ===================================================================
    // MSR — 측정/진행률 (BIZ-105)
    // ===================================================================

    @Test
    @DisplayName("MSR-1: 정량측정_현재값변경_progress자동(target=100,current=40→40)")
    void 정량측정_progress자동() {
        WorkItem w = item(1L, 100L, "TODO");
        when(workItemMapper.findById(1L)).thenReturn(w);
        when(workflowMapper.findStatusById(100L)).thenReturn(status(100, "TODO", "TODO", true, false));
        when(measureUnitMapper.findById(7L)).thenReturn(
                MeasureUnit.builder().id(7L).valueType("NUMBER").build());

        service.updateMeasure(1L, new WorkItemDtos.MeasureRequest(7L, BigDecimal.valueOf(100), BigDecimal.valueOf(40)), 99L);

        ArgumentCaptor<WorkItem> c = ArgumentCaptor.forClass(WorkItem.class);
        verify(workItemMapper).updateMeasure(c.capture());
        assertThat(c.getValue().getProgress()).isEqualTo(40);
    }

    @Test
    @DisplayName("MSR-2: 정성측정_상태기반progress(BOOLEAN, DONE이면 100)")
    void 정성측정_상태기반progress() {
        WorkItem w = item(1L, 104L, "DONE");
        when(workItemMapper.findById(1L)).thenReturn(w);
        when(workflowMapper.findStatusById(104L)).thenReturn(status(104, "DONE", "DONE", false, true));
        when(measureUnitMapper.findById(5L)).thenReturn(
                MeasureUnit.builder().id(5L).valueType("BOOLEAN").build());

        service.updateMeasure(1L, new WorkItemDtos.MeasureRequest(5L, null, null), 99L);

        ArgumentCaptor<WorkItem> c = ArgumentCaptor.forClass(WorkItem.class);
        verify(workItemMapper).updateMeasure(c.capture());
        assertThat(c.getValue().getProgress()).isEqualTo(100);
    }

    @Test
    @DisplayName("MSR-3: 측정변경_MeasureUpdated발행(progress 동일 트랜잭션 재계산)")
    void 측정변경_이벤트발행() {
        WorkItem w = item(1L, 100L, "TODO");
        w.setCurrentValue(BigDecimal.valueOf(10));  // previousValue
        when(workItemMapper.findById(1L)).thenReturn(w);
        when(workflowMapper.findStatusById(100L)).thenReturn(status(100, "TODO", "TODO", true, false));
        when(measureUnitMapper.findById(7L)).thenReturn(
                MeasureUnit.builder().id(7L).valueType("NUMBER").build());

        service.updateMeasure(1L, new WorkItemDtos.MeasureRequest(7L, BigDecimal.valueOf(100), BigDecimal.valueOf(40)), 99L);

        ArgumentCaptor<Object> ev = ArgumentCaptor.forClass(Object.class);
        verify(events).publishEvent(ev.capture());
        WorkItemEvents.MeasureUpdated e = (WorkItemEvents.MeasureUpdated) ev.getValue();
        assertThat(e.currentValue()).isEqualByComparingTo(BigDecimal.valueOf(40));
        assertThat(e.previousValue()).isEqualByComparingTo(BigDecimal.valueOf(10));
        assertThat(e.valueType()).isEqualTo("NUMBER");
    }

    @Test
    @DisplayName("AGG-1: 하위완료_상위Epic진행률자동(4건 중 2건 DONE → 50)")
    void 에픽진행률_자동집계() {
        WorkItem w = item(1L, 102L, "IN_PROGRESS");
        w.setEpicId(7L);
        when(workItemMapper.findById(1L)).thenReturn(w);
        when(workflowMapper.findStatusById(102L)).thenReturn(status(102, "IN_PROGRESS", "IN_PROGRESS", false, false));
        when(workflowMapper.findStatusById(104L)).thenReturn(status(104, "DONE", "DONE", false, true));
        when(workflowMapper.transitionExists(10L, 102L, 104L)).thenReturn(true);
        when(workItemMapper.findById(7L)).thenReturn(WorkItem.builder().id(7L).issueType("EPIC").build());
        when(workItemMapper.findByEpic(7L)).thenReturn(List.of(
                item(11L, 104L, "DONE"), item(12L, 104L, "DONE"),
                item(13L, 102L, "IN_PROGRESS"), item(14L, 100L, "TODO")));

        service.changeStatus(1L, new WorkItemDtos.ChangeStatusRequest(104L), 99L);

        verify(workItemMapper).updateProgress(7L, 50);
    }

    // ===================================================================
    // FSM — 착수일 자동(IN_PROGRESS 최초 진입 시 start_date 자동, Jira식)
    // ===================================================================

    @Test
    @DisplayName("FSM-13: IN_PROGRESS진입_startDate비어있으면_오늘로자동(Clock Mock)")
    void 진행중전이_startDate자동() {
        WorkItem w = item(1L, 100L, "TODO");   // start_date null
        when(workItemMapper.findById(1L)).thenReturn(w);
        when(workflowMapper.findStatusById(100L)).thenReturn(status(100, "TODO", "TODO", true, false));
        when(workflowMapper.findStatusById(102L)).thenReturn(status(102, "IN_PROGRESS", "IN_PROGRESS", false, false));
        when(workflowMapper.transitionExists(10L, 100L, 102L)).thenReturn(true);

        service.changeStatus(1L, new WorkItemDtos.ChangeStatusRequest(102L), 99L);

        ArgumentCaptor<WorkItem> c = ArgumentCaptor.forClass(WorkItem.class);
        verify(workItemMapper).updateStatus(c.capture());
        assertThat(c.getValue().getStartDate()).isEqualTo(FIXED.toLocalDate());  // 2026-06-26
    }

    @Test
    @DisplayName("FSM-14: IN_PROGRESS진입_startDate이미있으면_유지(덮어쓰지 않음)")
    void 진행중전이_startDate유지() {
        WorkItem w = item(1L, 100L, "TODO");
        LocalDate already = LocalDate.of(2026, 6, 1);
        w.setStartDate(already);
        when(workItemMapper.findById(1L)).thenReturn(w);
        when(workflowMapper.findStatusById(100L)).thenReturn(status(100, "TODO", "TODO", true, false));
        when(workflowMapper.findStatusById(102L)).thenReturn(status(102, "IN_PROGRESS", "IN_PROGRESS", false, false));
        when(workflowMapper.transitionExists(10L, 100L, 102L)).thenReturn(true);

        service.changeStatus(1L, new WorkItemDtos.ChangeStatusRequest(102L), 99L);

        ArgumentCaptor<WorkItem> c = ArgumentCaptor.forClass(WorkItem.class);
        verify(workItemMapper).updateStatus(c.capture());
        assertThat(c.getValue().getStartDate()).isEqualTo(already);  // 유지
    }

    // ===================================================================
    // HRC — DOC(문서) 유형 (depth 1, Sub-task 부모 불가)
    // ===================================================================

    @Test
    @DisplayName("HRC-7: DOC유형_부모없이생성_성공(depth 1, 단독 유형)")
    void 문서유형_생성_성공() {
        when(projectMapper.findById(5L)).thenReturn(devProject());
        when(workflowMapper.findStartStatus(10L)).thenReturn(status(100, "TODO", "TODO", true, false));
        when(workItemMapper.nextSeq(5L)).thenReturn(1);
        when(workItemMapper.findById(any())).thenReturn(item(1L, 100L, "TODO"));

        service.create(createReq("DOC", null), 99L);

        ArgumentCaptor<WorkItem> c = ArgumentCaptor.forClass(WorkItem.class);
        verify(workItemMapper).insert(c.capture());
        assertThat(c.getValue().getIssueType()).isEqualTo("DOC");
    }

    @Test
    @DisplayName("HRC-8: DOC를Sub태스크부모로_거부(canBeSubtaskParent=false)")
    void 문서를_서브태스크부모로_거부() {
        when(projectMapper.findById(5L)).thenReturn(devProject());
        WorkItem doc = WorkItem.builder().id(7L).issueType("DOC").build();
        when(workItemMapper.findById(7L)).thenReturn(doc);
        assertThatThrownBy(() -> service.create(createReq("SUBTASK", 7L), 99L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.HIERARCHY_VIOLATION);
    }

    // ===================================================================
    // 결과(완료 산출물) 저장 — WMP-WI-017, BIZ-114, CR-048
    // ===================================================================

    @Test
    @DisplayName("RSLT-1: 결과저장_본문·작성자·시각이_세팅되고_updateResult호출됨")
    void 결과저장_본문작성자시각_세팅() {
        when(workItemMapper.findById(1L)).thenReturn(item(1L, 100L, "TODO"));
        ArgumentCaptor<WorkItem> c = ArgumentCaptor.forClass(WorkItem.class);

        service.saveResult(1L, new WorkItemDtos.ResultRequest("<p>SNS+뉴스레터로 확정</p>"), 99L);

        verify(workItemMapper).updateResult(c.capture());
        WorkItem saved = c.getValue();
        assertThat(saved.getResultContent()).isEqualTo("<p>SNS+뉴스레터로 확정</p>");
        assertThat(saved.getResultWrittenBy()).isEqualTo(99L);       // 작성자=호출자
        assertThat(saved.getResultWrittenAt()).isEqualTo(FIXED);     // 시각=고정 clock
    }

    @Test
    @DisplayName("RSLT-2: 결과저장은_상태와무관(미완료여도_허용, DONE 전제조건 아님)")
    void 결과저장_상태무관_허용() {
        // 진행중(IN_PROGRESS)이어도 결과 저장 자체는 허용 — 완료 노출은 화면 책임
        when(workItemMapper.findById(1L)).thenReturn(item(1L, 100L, "IN_PROGRESS"));

        service.saveResult(1L, new WorkItemDtos.ResultRequest("중간 결과"), 99L);

        verify(workItemMapper).updateResult(any());  // 상태 검증 없이 저장됨
    }

    // ── 인수조건 완료 강제 (CR-049, WMP-WI-018, BIZ-115/116) ──

    private com.therecommerce.workmap.workitem.domain.AcceptanceCriterion crit(String text, boolean checked) {
        return com.therecommerce.workmap.workitem.domain.AcceptanceCriterion.builder()
                .text(text).checked(checked).build();
    }

    private WorkItem itemWithCriteria(java.util.List<com.therecommerce.workmap.workitem.domain.AcceptanceCriterion> ac) {
        WorkItem w = item(1L, 103L, "IN_REVIEW");
        w.setAcceptanceCriteria(ac);
        return w;
    }

    private void stubReviewToDone() {
        when(workflowMapper.findStatusById(103L)).thenReturn(status(103, "IN_REVIEW", "IN_REVIEW", false, false));
        when(workflowMapper.findStatusById(104L)).thenReturn(status(104, "DONE", "DONE", false, true));
        when(workflowMapper.transitionExists(10L, 103L, 104L)).thenReturn(true);
    }

    @Test
    @DisplayName("AC-1: 강제프로젝트_미충족있음_DONE전이거부(BIZ-116, WMP-7850)")
    void 강제_미충족_완료거부() {
        WorkItem w = itemWithCriteria(List.of(crit("토큰 발급", true), crit("만료 갱신", false)));
        when(workItemMapper.findById(1L)).thenReturn(w);
        stubReviewToDone();
        when(projectMapper.findById(5L)).thenReturn(
                Project.builder().id(5L).requireAcceptanceCriteria(true).build());

        assertThatThrownBy(() -> service.changeStatus(1L, new WorkItemDtos.ChangeStatusRequest(104L), 99L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.ACCEPTANCE_CRITERIA_UNMET);
        verify(workItemMapper, never()).updateStatus(any());  // 전이 미반영
    }

    @Test
    @DisplayName("AC-2: 강제프로젝트_전부충족_DONE전이허용(미충족0이라 project조회조차 스킵)")
    void 강제_전부충족_완료허용() {
        WorkItem w = itemWithCriteria(List.of(crit("토큰 발급", true), crit("만료 갱신", true)));
        when(workItemMapper.findById(1L)).thenReturn(w);
        stubReviewToDone();
        // 전부 충족이면 미충족이 0이라 강제 검사(projectMapper.findById) 자체를 안 탄다(성능)

        service.changeStatus(1L, new WorkItemDtos.ChangeStatusRequest(104L), 99L);

        verify(workItemMapper).updateStatus(any());       // 전이 반영됨
        verify(projectMapper, never()).findById(any());   // 미충족 없으면 강제 검사 스킵
        verify(activityLogMapper, never()).insert(argThat(a ->
                ActivityLog.COMPLETE_WITH_UNMET.equals(a.getAction())));  // 미충족 스냅샷 없음
    }

    @Test
    @DisplayName("AC-3: 비강제프로젝트_미충족있음_완료허용 + COMPLETE_WITH_UNMET스냅샷기록")
    void 비강제_미충족_완료허용_스냅샷() {
        WorkItem w = itemWithCriteria(List.of(crit("토큰 발급", true), crit("만료 갱신", false)));
        when(workItemMapper.findById(1L)).thenReturn(w);
        stubReviewToDone();
        when(projectMapper.findById(5L)).thenReturn(
                Project.builder().id(5L).requireAcceptanceCriteria(false).build());

        service.changeStatus(1L, new WorkItemDtos.ChangeStatusRequest(104L), 99L);

        verify(workItemMapper).updateStatus(any());  // 통과
        ArgumentCaptor<ActivityLog> c = ArgumentCaptor.forClass(ActivityLog.class);
        verify(activityLogMapper, atLeastOnce()).insert(c.capture());
        ActivityLog snap = c.getAllValues().stream()
                .filter(a -> ActivityLog.COMPLETE_WITH_UNMET.equals(a.getAction()))
                .findFirst().orElseThrow();
        assertThat(snap.getActorId()).isEqualTo(99L);            // 누가
        assertThat(snap.getMetadata()).contains("만료 갱신");     // 어떤 항목 미충족
        assertThat(snap.getMetadata()).contains("\"total\":2").contains("\"met\":1");
    }

    @Test
    @DisplayName("AC-4: 강제프로젝트_인수조건없음_완료허용(운영형 보호)")
    void 강제_인수조건없음_완료허용() {
        WorkItem w = itemWithCriteria(List.of());   // 인수조건 없음
        when(workItemMapper.findById(1L)).thenReturn(w);
        stubReviewToDone();
        // 인수조건 없으면 강제여도 projectMapper.findById조차 호출 안 함(미충족 없음)

        service.changeStatus(1L, new WorkItemDtos.ChangeStatusRequest(104L), 99L);

        verify(workItemMapper).updateStatus(any());  // 통과
        verify(projectMapper, never()).findById(any());  // 강제 검사 스킵
    }

    @Test
    @DisplayName("AC-5: 인수조건체크저장_checked항목에checkedBy·checkedAt설정")
    void 인수조건체크_저장() {
        when(workItemMapper.findById(1L)).thenReturn(item(1L, 103L, "IN_REVIEW"));
        var req = new WorkItemDtos.AcceptanceCriteriaRequest(List.of(
                new WorkItemDtos.AcceptanceCriteriaRequest.AcceptanceItem("토큰 발급", true),
                new WorkItemDtos.AcceptanceCriteriaRequest.AcceptanceItem("만료 갱신", false)));

        service.saveAcceptanceCriteria(1L, req, 77L);

        ArgumentCaptor<WorkItem> c = ArgumentCaptor.forClass(WorkItem.class);
        verify(workItemMapper).updateAcceptanceCriteria(c.capture());
        var saved = c.getValue().getAcceptanceCriteria();
        assertThat(saved).hasSize(2);
        assertThat(saved.get(0).isChecked()).isTrue();
        assertThat(saved.get(0).getCheckedBy()).isEqualTo(77L);   // 체크한 사람
        assertThat(saved.get(0).getCheckedAt()).isEqualTo(FIXED);
        assertThat(saved.get(1).isChecked()).isFalse();
        assertThat(saved.get(1).getCheckedBy()).isNull();         // 미체크는 clear
    }
}
