// 받은함 (/inbox) — 내게 온 알림·멘션·배정 통합(§받은함, WMP-NOTI-001). Sprint5.
// 데이터=실 BE GET /inbox(목록+안읽음 배지), 읽음=PATCH /notifications/{id}/read. 행 클릭→업무 상세.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Skeleton } from '@therecommerce/ds-ui';
import { Inbox, AlertTriangle, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { ROUTES } from '@/lib/route-paths';
import { PageHead } from '@/components/badges';
import { EmptyState } from '@/components/common/empty-state';
import { useInbox, useMarkRead, type InboxFilter } from '@/features/inbox/hooks';
import { NotificationRow } from '@/features/inbox/components/NotificationRow';

const PAGE_SIZE = 20;
const TABS: { key: InboxFilter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'unread', label: '안 읽음' },
];

export function InboxPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<InboxFilter>('all');
  const [page, setPage] = useState(0);

  const { data, isPending, isError } = useInbox(filter, page, PAGE_SIZE);
  const markRead = useMarkRead(filter, page);

  const items = data?.notifications.items ?? [];
  const totalPages = data?.notifications.totalPages ?? 0;
  const unread = data?.unreadCount ?? 0;

  function switchFilter(f: InboxFilter) {
    setFilter(f);
    setPage(0);
  }

  return (
    <div>
      <PageHead
        title="받은함"
        desc="내게 온 알림·멘션·배정"
        actions={
          <div className="flex items-center gap-2">
            {unread > 0 && (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                안 읽음 {unread}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(ROUTES.accountNotifications)}
            >
              <Settings className="size-4" />
              알림 설정
            </Button>
          </div>
        }
      />

      {/* 필터 토글 */}
      <div className="mb-4 inline-flex rounded-md border border-border p-0.5">
        {TABS.map((t) => (
          <Button
            key={t.key}
            variant={filter === t.key ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => switchFilter(t.key)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {isPending ? (
        <div className="flex flex-col gap-1.5 rounded-lg border border-border p-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 rounded" />)}
        </div>
      ) : isError ? (
        <EmptyState
          icon={<AlertTriangle className="size-6" />}
          title="받은함을 불러오지 못했습니다"
          description="잠시 후 다시 시도해 주세요."
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Inbox className="size-6" />}
          title={filter === 'unread' ? '안 읽은 알림이 없습니다' : '받은 알림이 없습니다'}
          description="배정·멘션·막힘 알림이 도착하면 여기에 표시됩니다."
        />
      ) : (
        <>
          <div className="divide-y divide-border rounded-lg border border-border">
            {items.map((n) => (
              <NotificationRow
                key={n.id}
                item={n}
                onMarkRead={(id) => markRead.mutate(id)}
                marking={markRead.isPending}
              />
            ))}
          </div>
          <Pager page={page} totalPages={totalPages} onPage={setPage} />
        </>
      )}
    </div>
  );
}

function Pager({ page, totalPages, onPage }: {
  page: number; totalPages: number; onPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-3 flex items-center justify-center gap-3">
      <Button variant="ghost" size="sm" disabled={page <= 0} onClick={() => onPage(page - 1)}>
        <ChevronLeft className="size-4" /> 이전
      </Button>
      <span className="text-sm text-muted-foreground">{page + 1} / {totalPages}</span>
      <Button variant="ghost" size="sm" disabled={page >= totalPages - 1} onClick={() => onPage(page + 1)}>
        다음 <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
