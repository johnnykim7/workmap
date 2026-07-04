// 보고서 탭 (/projects/:key/reports, WMP-HOME-003) — 진행률·지연·막힘 + 상태/유형/담당자 분포.
// 라우트는 :key → useProjectByKey로 numeric id 해소 후 GET /projects/{id}/report 호출.
import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertTriangle, BarChart3 } from 'lucide-react';
import {
  Skeleton,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@therecommerce/ds-ui';
import { useProjectByKey } from '@/features/projects/hooks';
import { useProjectReport } from '@/features/dashboard/hooks';
import { useSprints } from '@/features/agile/hooks';
import { useBurndown, useVelocity } from '@/features/burndown/hooks';
import { useThroughput } from '@/features/ops/hooks';
import { BurndownChart } from '@/features/burndown/components/BurndownChart';
import { VelocityChart } from '@/features/burndown/components/VelocityChart';
import { useAssigneeName } from '@/features/members/use-assignee-name';
import { MetricCard } from '@/features/dashboard/components/MetricCard';
import { DistributionBars } from '@/features/dashboard/components/DistributionBars';
import { EmptyState } from '@/components/common/empty-state';
import { PageShell } from '@/components/common/page-shell';
import { PageHead } from '@/components/badges';
import { WORK_STATUS_LABEL, ISSUE_TYPE_LABEL, type WorkStatus, type IssueType } from '@/types/domain';

export function ReportsView() {
  const { key = '' } = useParams();
  const { data: project, isPending: projectPending } = useProjectByKey(key);
  const projectId = project?.id;

  const { data: report, isPending, isError } = useProjectReport(projectId);
  const assigneeName = useAssigneeName(projectId);

  // P2 번다운/벨로시티(WMP-AGL-006) — 번다운은 스프린트 선택, 벨로시티는 프로젝트 단위.
  const { data: sprints = [] } = useSprints(projectId);
  const [selectedSprintId, setSelectedSprintId] = useState<string>('');
  const effectiveSprintId = useMemo(() => {
    if (selectedSprintId) return Number(selectedSprintId);
    // 기본: 진행중(ACTIVE) 우선, 없으면 첫 스프린트.
    const active = sprints.find((s) => s.status === 'ACTIVE');
    return active?.id ?? sprints[0]?.id;
  }, [selectedSprintId, sprints]);
  const { data: burndown } = useBurndown(effectiveSprintId);
  const { data: velocity } = useVelocity(projectId);
  const sprintName = (id: number) => sprints.find((s) => s.id === id)?.name;

  // P2 처리량(WMP-OPS-002) — 전체 기간(from/to 미지정) 담당자별 완료 건수.
  const { data: throughput } = useThroughput(projectId);

  if (projectPending || (projectId && isPending && !report)) {
    return (
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
        <Skeleton className="h-14 w-full rounded-lg" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (isError || !report) {
    return (
      <EmptyState
        icon={<AlertTriangle className="size-6" />}
        title="보고서를 불러오지 못했습니다"
        description="잠시 후 다시 시도해 주세요."
      />
    );
  }

  const s = report.summary;

  // 담당자 분포 라벨: key=assigneeId(문자열). 미배정/해소 실패는 그대로 표기.
  const assigneeLabel = (k: string) => {
    if (!k || k === 'null' || k === '0') return '미배정';
    const name = assigneeName(Number(k));
    return name ?? `사용자 #${k}`;
  };

  return (
    <PageShell
      header={<PageHead title="보고서" desc={`${report.projectName} · 진행률·지연·막힘·담당자 부하`} />}
      bodyClassName="flex flex-col gap-5"
    >
      {/* 요약 지표 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="전체 항목" value={s.total} icon={<BarChart3 className="size-3.5" />} />
        <MetricCard label="완료" value={s.done} />
        <MetricCard label="지연" value={s.delayed} tone={s.delayed > 0 ? 'amber' : undefined} />
        <MetricCard label="막힘" value={s.blocked} tone={s.blocked > 0 ? 'red' : undefined} />
      </div>

      {/* 진행률 */}
      <div className="rounded-lg border border-border p-4">
        <div className="mb-1.5 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">진행률</span>
          <span className="font-medium text-foreground">{s.progress}%</span>
        </div>
        <span className="block h-2 w-full overflow-hidden rounded-full bg-muted">
          <span className="block h-full rounded-full bg-primary" style={{ width: `${s.progress}%` }} />
        </span>
      </div>

      {/* 분포 위젯 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <DistributionBars
          title="상태별 분포"
          items={report.byStatus}
          labelOf={(k) => WORK_STATUS_LABEL[k as WorkStatus] ?? k}
        />
        <DistributionBars
          title="유형별 분포"
          items={report.byType}
          labelOf={(k) => ISSUE_TYPE_LABEL[k as IssueType] ?? k}
        />
        <DistributionBars
          title="담당자 부하"
          items={report.byAssignee}
          labelOf={assigneeLabel}
        />
        {/* 처리량(WMP-OPS-002): 담당자별 완료 건수 */}
        <DistributionBars
          title={`처리량 (완료 ${throughput?.totalDone ?? 0}건)`}
          items={(throughput?.byAssignee ?? []).map((a) => ({
            key: a.assigneeId != null ? String(a.assigneeId) : '0',
            count: a.doneCount,
          }))}
          labelOf={assigneeLabel}
          emptyText="완료 이력 없음"
        />
      </div>

      {/* P2: 번다운 / 벨로시티 (WMP-AGL-006) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground">번다운</h3>
            {sprints.length > 0 && (
              <Select
                value={effectiveSprintId != null ? String(effectiveSprintId) : ''}
                onValueChange={setSelectedSprintId}
              >
                <SelectTrigger className="h-8 w-44"><SelectValue placeholder="스프린트 선택" /></SelectTrigger>
                <SelectContent>
                  {sprints.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          {sprints.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">스프린트가 없습니다.</p>
          ) : burndown ? (
            <BurndownChart data={burndown} />
          ) : (
            <Skeleton className="h-48 w-full rounded" />
          )}
        </div>

        <div className="rounded-lg border border-border p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">벨로시티</h3>
          {velocity ? (
            <VelocityChart data={velocity} sprintName={sprintName} />
          ) : (
            <Skeleton className="h-40 w-full rounded" />
          )}
        </div>
      </div>
    </PageShell>
  );
}
