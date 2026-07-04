// 활동 이력 — §9.3. GET /work-items/{id}/activities. actor는 멤버 이름 해소, action별 한 줄 표기.
import { Avatar, AvatarFallback } from '@therecommerce/ds-ui';
import { fmtDateTime } from '@/lib/date';
import { useMembers } from '@/features/members/hooks';
import { type WorkItemResponse } from '@/types/domain';
import { useActivities } from '../hooks';

// 활동 action 코드 → 사람용 라벨(BE ActivityLog.action). 미상은 코드 그대로.
export const ACTION_LABEL: Record<string, string> = {
  CREATE: '생성',
  STATUS_CHANGE: '상태 변경',
  ASSIGNEE_CHANGE: '담당자 변경',
  UPDATE: '수정',
  COMMENT: '댓글',
  LINK: '업무 연결',
  MEASURE: '측정값 변경',
  SPRINT_CHANGE: '스프린트 변경',
  APPROVAL: '승인 처리',
};

export function ActivityFeed({ item }: { item: WorkItemResponse }) {
  const { data: activities = [], isPending } = useActivities(item.id);
  const { data: members = [] } = useMembers(item.projectId);
  const nameOf = (id?: number | null) => (id != null ? members.find((m) => m.userId === id)?.name : undefined) ?? '알 수 없음';

  return (
    <section>
      <h2 className="mb-1.5 text-sm font-semibold text-foreground">활동 이력</h2>
      {isPending ? (
        <p className="text-sm text-muted-foreground">불러오는 중…</p>
      ) : activities.length === 0 ? (
        <p className="text-sm text-muted-foreground">활동 이력이 없습니다.</p>
      ) : (
        <ul className="space-y-2.5">
          {activities.map((a) => (
            <li key={a.id} className="flex items-start gap-2 text-sm">
              <Avatar className="size-6 shrink-0"><AvatarFallback className="text-[10px]">{nameOf(a.actorId)[0]}</AvatarFallback></Avatar>
              <div className="flex-1">
                <span className="font-medium text-foreground">{nameOf(a.actorId)}</span>{' '}
                <span className="text-muted-foreground">{ACTION_LABEL[a.action] ?? a.action}</span>
                {(a.fromValue || a.toValue) && (
                  <span className="text-muted-foreground">
                    {' '}: {a.fromValue ?? '–'} → {a.toValue ?? '–'}
                  </span>
                )}
                <div className="text-xs text-muted-foreground">{fmtDateTime(a.createdAt)}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
