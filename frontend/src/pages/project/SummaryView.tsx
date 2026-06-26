// 프로젝트 요약 탭 — 개요/진행률/지연/막힘 + 멤버 패널(T3-3 §프로젝트 요약). Sprint 2.
// 라우트는 :key, BE는 numeric id 요구 → useProjectByKey로 해소 후 id로 summary/members 호출.
import { useParams } from 'react-router-dom';
import { Skeleton } from '@therecommerce/ds-ui';
import { useProjectByKey, useProjectSummary } from '@/features/projects/hooks';
import { MembersPanel } from '@/features/members/components/MembersPanel';

function Metric({ label, value, tone }: { label: string; value: number | string; tone?: 'amber' | 'red' }) {
  const color = tone === 'amber' ? 'text-amber-600' : tone === 'red' ? 'text-red-600' : 'text-foreground';
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${color}`}>{value}</div>
    </div>
  );
}

export function SummaryView() {
  const { key = '' } = useParams();
  const { data: project } = useProjectByKey(key);
  const { data: s, isPending } = useProjectSummary(project?.id);

  return (
    <div className="flex flex-col gap-5">
      {isPending || !s ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="전체 항목" value={s.total} />
            <Metric label="완료" value={s.done} />
            <Metric label="지연" value={s.delayed} tone={s.delayed > 0 ? 'amber' : undefined} />
            <Metric label="막힘" value={s.blocked} tone={s.blocked > 0 ? 'red' : undefined} />
          </div>
          <div className="rounded-lg border border-border p-4">
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">진행률</span>
              <span className="font-medium text-foreground">{s.progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${s.progress}%` }} />
            </div>
          </div>
        </>
      )}

      <MembersPanel projectId={project?.id} />
    </div>
  );
}
