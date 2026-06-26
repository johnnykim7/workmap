package com.therecommerce.workmap.ops.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.ops.dto.OpsDtos;
import com.therecommerce.workmap.project.mapper.ProjectMapper;
import com.therecommerce.workmap.workitem.domain.IssueType;
import com.therecommerce.workmap.workitem.domain.WorkItem;
import com.therecommerce.workmap.workitem.dto.WorkItemDtos;
import com.therecommerce.workmap.workitem.mapper.WorkItemLinkMapper;
import com.therecommerce.workmap.workitem.mapper.WorkItemMapper;
import com.therecommerce.workmap.workitem.service.WorkItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 운영 실행 서비스(Sprint 4). 처리량(WMP-OPS-002) / 현장이슈→개발 백로그 전환(WMP-OPS-003).
 *
 * <ul>
 *   <li>처리량: 기간 내 완료(completed_at) 항목을 담당자별 집계.</li>
 *   <li>전환: 원본 work_item을 두고 개발 프로젝트에 신규 백로그 항목을 생성, 원본↔신규 RELATES_TO 링크(BIZ-109).</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
public class OperationsService {

    private final WorkItemMapper workItemMapper;
    private final WorkItemLinkMapper linkMapper;
    private final ProjectMapper projectMapper;
    private final WorkItemService workItemService;
    private final Clock clock;

    /** 처리량(OPS-002): 기간[from, to] 내 완료 항목을 담당자별 집계. to 미포함 경계는 +1일. */
    @Transactional(readOnly = true)
    public OpsDtos.ThroughputResponse throughput(Long projectId, LocalDate from, LocalDate to) {
        if (projectMapper.findById(projectId) == null) {
            throw new BusinessException(WmpErrorCode.PROJECT_NOT_FOUND);
        }
        LocalDate effFrom = from != null ? from : LocalDate.now(clock).minusDays(6);  // 기본 최근 7일
        LocalDate effTo = to != null ? to : LocalDate.now(clock);

        ZoneId zone = clock.getZone();
        OffsetDateTime fromTs = effFrom.atStartOfDay(zone).toOffsetDateTime();
        OffsetDateTime toTs = effTo.plusDays(1).atStartOfDay(zone).toOffsetDateTime();  // [from, to] 포함

        List<WorkItem> done = workItemMapper.findCompletedBetween(projectId, fromTs, toTs);

        Map<Long, Integer> counts = new HashMap<>();
        for (WorkItem w : done) {
            counts.merge(w.getAssigneeId(), 1, Integer::sum);  // null 키 = 미배정
        }
        List<OpsDtos.AssigneeThroughput> byAssignee = new ArrayList<>();
        counts.forEach((aid, cnt) -> byAssignee.add(new OpsDtos.AssigneeThroughput(aid, cnt)));

        return new OpsDtos.ThroughputResponse(projectId, effFrom, effTo, done.size(), byAssignee);
    }

    /** 현장 이슈 → 개발 백로그 전환(OPS-003). 신규 항목 생성 + 원본↔신규 RELATES_TO 양방향 링크. */
    @Transactional
    public OpsDtos.PromoteResult promoteToBacklog(Long originId, OpsDtos.PromoteRequest req, Long actorId) {
        WorkItem origin = workItemService.getEntity(originId);  // 없으면 WORK_ITEM_NOT_FOUND

        Long targetProjectId = req != null && req.targetProjectId() != null
                ? req.targetProjectId() : origin.getProjectId();
        String issueType = req != null && req.issueType() != null ? req.issueType() : IssueType.STORY.name();
        String title = req != null && req.title() != null ? req.title() : origin.getTitle();
        String description = req != null ? req.description() : null;

        WorkItemDtos.CreateRequest create = new WorkItemDtos.CreateRequest(
                targetProjectId, issueType, null, null, title,
                description != null ? description : origin.getDescription(),
                origin.getPriority(), null, actorId, null,  // 백로그(sprintId=null), 미배정
                null, null, null, null,
                null, null, null, null, null, null, null, null, null, null, null, null);

        WorkItemDtos.Response promoted = workItemService.create(create, actorId);

        // 원본↔신규 RELATES_TO 양방향 링크(BIZ-109)
        linkMapper.insert(originId, promoted.id(), "RELATES_TO");
        linkMapper.insert(promoted.id(), originId, "RELATES_TO");

        return new OpsDtos.PromoteResult(originId, promoted);
    }
}
