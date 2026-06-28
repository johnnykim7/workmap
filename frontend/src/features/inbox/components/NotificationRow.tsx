// 받은함 알림 행(§받은함) — 유형 아이콘 + 메시지 + 시각 + 읽음 처리.
// 클릭 → 연결된 업무 상세(workItemId→key 해소 후 이동). 안읽음은 좌측 점·진한 톤으로 신호.
import { useNavigate } from 'react-router-dom';
import {
  UserPlus, Ban, AtSign, Bell, Check,
  MessageSquare, ArrowRightLeft, CalendarClock, CalendarX, Flag, CheckCircle2,
} from 'lucide-react';
import { Button } from '@therecommerce/ds-ui';
import { fmtDateTime } from '@/lib/date';
import { ROUTES } from '@/lib/route-paths';
import { workItemApi } from '@/features/workitem/api';
import type { NotificationItem } from '../api';

// 유형별 아이콘·색(신호용 최소). 미지정 유형은 일반 종. (CR-028 신규 종류 추가)
function typeMeta(type: string) {
  switch (type) {
    case 'ASSIGNED': return { icon: UserPlus, color: 'text-blue-500', label: '배정' };
    case 'BLOCKED': return { icon: Ban, color: 'text-red-500', label: '막힘' };
    case 'MENTIONED': return { icon: AtSign, color: 'text-violet-500', label: '멘션' };
    case 'COMMENTED': return { icon: MessageSquare, color: 'text-muted-foreground', label: '댓글' };
    case 'STATUS_CHANGED': return { icon: ArrowRightLeft, color: 'text-muted-foreground', label: '상태변경' };
    case 'DUE_APPROACHING': return { icon: CalendarClock, color: 'text-amber-500', label: '마감임박' };
    case 'OVERDUE': return { icon: CalendarX, color: 'text-red-500', label: '마감초과' };
    case 'SPRINT_STARTED':
    case 'SPRINT_COMPLETED': return { icon: Flag, color: 'text-muted-foreground', label: '스프린트' };
    case 'APPROVAL_REQUESTED':
    case 'APPROVAL_DECIDED': return { icon: CheckCircle2, color: 'text-muted-foreground', label: '승인' };
    default: return { icon: Bell, color: 'text-muted-foreground', label: '알림' };
  }
}

export function NotificationRow({
  item, onMarkRead, marking,
}: {
  item: NotificationItem;
  onMarkRead: (id: number) => void;
  marking?: boolean;
}) {
  const navigate = useNavigate();
  const meta = typeMeta(item.type);
  const Icon = meta.icon;

  // 알림은 workItemId(숫자)만 보유 → 단건 조회로 key 해소 후 상세 이동.
  async function openItem() {
    if (item.workItemId == null) return;
    if (!item.isRead) onMarkRead(item.id);
    try {
      const wi = await workItemApi.get(item.workItemId);
      navigate(ROUTES.workItem(wi.key));
    } catch {
      // 조회 실패(삭제/권한) — 이동 생략. 읽음 처리는 유지.
    }
  }

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/40 ${
        item.isRead ? '' : 'bg-primary/[0.03]'
      }`}
    >
      {/* 안읽음 신호 점 */}
      <span className={`size-1.5 shrink-0 rounded-full ${item.isRead ? 'bg-transparent' : 'bg-primary'}`} />

      <Icon className={`size-4 shrink-0 ${meta.color}`} aria-label={meta.label} />

      <button
        type="button"
        onClick={openItem}
        disabled={item.workItemId == null}
        className="min-w-0 flex-1 text-left disabled:cursor-default"
      >
        <p className={`truncate text-sm ${item.isRead ? 'text-muted-foreground' : 'font-medium text-foreground'}`}>
          {item.message}
        </p>
        <span className="text-[11px] text-muted-foreground">{fmtDateTime(item.createdAt)}</span>
      </button>

      {!item.isRead && (
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 gap-1 text-xs"
          disabled={marking}
          onClick={() => onMarkRead(item.id)}
        >
          <Check className="size-3.5" /> 읽음
        </Button>
      )}
    </div>
  );
}
