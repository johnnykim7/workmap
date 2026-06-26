// 보고서 탭 (/projects/:key/reports, WMP-HOME-003) — 진행률·지연·막힘 + 상태/유형/담당자 분포.
// 라우트는 :key → useProjectByKey로 numeric id 해소 후 GET /projects/{id}/report 호출.
import { useParams } from 'react-router-dom';
import { AlertTriangle, BarChart3 } from 'lucide-react';
import { useProjectByKey } from '@/features/projects/hooks';
import { useProjectReport } from '@/features/dashboard/hooks';
import { useAssigneeName } from '@/features/members/use-assignee-name';
import { MetricCard } from '@/features/dashboard/components/MetricCard';
import { DistributionBars } from '@/features/dashboard/components/DistributionBars';
import { EmptyState } from '@/components/common/empty-state';
import { PageHead } from '@/components/badges';
import { Skeleton } from '@therecommerce/ds-ui';
import { WORK_STATUS_LABEL, ISSUE_TYPE_LABEL, type WorkStatus, type IssueType } from '@/types/domain';

export function ReportsView() {
  const { key = '' } = useParams();
  const { data: project, isPending: projectPending } = useProjectByKey(key);
  const projectId = project?.id;

  const { data: report, isPending, isError } = useProjectReport(projectId);
  const assigneeName = useAssigneeName(projectId);

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
    <div className="flex flex-col gap-5">
      <PageHead title="보고서" desc={`${report.projectName} · 진행률·지연·막힘·담당자 부하`} />

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
      </div>
    </div>
  );
}
