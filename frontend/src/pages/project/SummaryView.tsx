// 프로젝트 요약 탭 — 개요/진행률/지연/막힘(T3-3 §프로젝트 요약). Sprint 2.
// 멤버 관리는 요약에서 제거 — 프로젝트 설정으로 이전 예정(전역 사용자=설정>사용자와 별개 레이어).
// 라우트는 :key, BE는 numeric id 요구 → useProjectByKey로 해소 후 id로 summary 호출.
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Skeleton } from '@therecommerce/ds-ui';
import { Settings } from 'lucide-react';
import { useProjectByKey, useProjectSummary } from '@/features/projects/hooks';
import { ProjectSettingsDialog } from '@/features/projects/components/ProjectSettingsDialog';
import { PageShell } from '@/components/common/page-shell';
import { useAuthStore } from '@/store/auth-store';

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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const role = useAuthStore((st) => st.user?.role);
  const canManage = role === 'OWNER' || role === 'ADMIN' || role === 'MANAGER';

  return (
    <PageShell bodyClassName="flex flex-col gap-5">
      {canManage && project && (
        <div className="flex items-center justify-end">
          <Button variant="secondary" size="sm" onClick={() => setSettingsOpen(true)}>
            <Settings className="size-4" /> 설정
          </Button>
        </div>
      )}

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

      {canManage && (
        <ProjectSettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          project={project ?? null}
        />
      )}
    </PageShell>
  );
}
