// 헤더 알림 벨(CR-028 인앱 실시간) — 안읽음 배지 + Popover 최근 알림 드롭다운.
// 폴링(useUnreadCount)으로 배지 갱신, 새 알림 토스트는 AppShell의 useNewNotificationToast가 담당.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Button,
  Skeleton,
} from '@therecommerce/ds-ui';
import { ROUTES } from '@/lib/route-paths';
import { EmptyState } from '@/components/common/empty-state';
import { useInbox, useMarkRead, useUnreadCount } from '../hooks';
import { NotificationRow } from './NotificationRow';

const PREVIEW_SIZE = 8;

export function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { data: unread = 0 } = useUnreadCount();

  // 드롭다운 열렸을 때만 최근 알림 패칭(가벼움). 'all' 필터·0페이지로 useMarkRead와 키 정합.
  const { data, isPending } = useInbox('all', 0, PREVIEW_SIZE);
  const markRead = useMarkRead('all', 0);
  const items = data?.notifications.items ?? [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative rounded-full p-1.5 text-muted-foreground outline-none hover:bg-muted/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`알림${unread > 0 ? ` (안읽음 ${unread})` : ''}`}
        >
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-4 text-destructive-foreground">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-sm font-medium">알림</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              setOpen(false);
              navigate(ROUTES.inbox);
            }}
          >
            전체 보기
          </Button>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {isPending ? (
            <div className="space-y-2 p-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : items.length === 0 ? (
            <div className="p-4">
              <EmptyState icon={<Bell className="size-5" />} title="알림이 없습니다" />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {items.map((item) => (
                <NotificationRow
                  key={item.id}
                  item={item}
                  onMarkRead={(id) => markRead.mutate(id)}
                  marking={markRead.isPending}
                />
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
