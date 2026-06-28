// 받은함 훅 — 목록(읽음/안읽음 필터) + 읽음 처리(낙관적 업데이트 + 서버 권위 재동기화)
// + 안읽음 폴링/새 알림 토스트(CR-028 인앱 실시간).
import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@therecommerce/ds-ui';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/route-paths';
import { useAuthStore } from '@/store/auth-store';
import { inboxApi, type InboxResponse } from './api';

export type InboxFilter = 'all' | 'unread';

// 헤더 벨 배지 폴링 주기(ms). 채팅(5s)보다 길게 — 받은함은 즉시성 요구가 덜함.
const UNREAD_POLL_MS = 30_000;

export const inboxKeys = {
  list: (filter: InboxFilter, page: number) => ['inbox', filter, page] as const,
  unread: ['inbox', 'unread-count'] as const,
};

function isReadOf(filter: InboxFilter): boolean | undefined {
  return filter === 'unread' ? false : undefined;
}

export function useInbox(filter: InboxFilter, page = 0, size = 20) {
  return useQuery({
    queryKey: inboxKeys.list(filter, page),
    queryFn: () => inboxApi.inbox(isReadOf(filter), page, size),
  });
}

// 읽음 처리. 낙관적으로 해당 알림 isRead=true·unreadCount-1, 실패 시 롤백. 성공/실패 모두 invalidate.
export function useMarkRead(filter: InboxFilter, page = 0) {
  const qc = useQueryClient();
  const key = inboxKeys.list(filter, page);
  return useMutation({
    mutationFn: (id: number) => inboxApi.markRead(id),
    onMutate: async (id: number) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<InboxResponse>(key);
      if (prev) {
        qc.setQueryData<InboxResponse>(key, {
          ...prev,
          unreadCount: Math.max(0, prev.unreadCount - 1),
          notifications: {
            ...prev.notifications,
            items: prev.notifications.items.map((n) =>
              n.id === id ? { ...n, isRead: true } : n,
            ),
          },
        });
      }
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
      toast.error('읽음 처리에 실패했습니다.');
    },
    onSettled: () => {
      // 모든 받은함 쿼리(필터/페이지) 재동기화 — 안읽음 필터에서 사라지는 것 반영.
      qc.invalidateQueries({ queryKey: ['inbox'] });
    },
  });
}

// 안 읽음 개수 폴링(헤더 벨 배지). 로그인 상태에서만 활성.
export function useUnreadCount() {
  const isAuthed = useAuthStore((s) => !!s.accessToken);
  return useQuery({
    queryKey: inboxKeys.unread,
    queryFn: () => inboxApi.unreadCount(),
    refetchInterval: UNREAD_POLL_MS,
    refetchOnWindowFocus: true,
    enabled: isAuthed,
  });
}

// 새 알림 도착 감지 → 토스트. 안읽음 개수가 직전보다 늘면 "새 알림" 토스트(받은함 이동 액션).
// 헤더에 1회만 마운트해 전역 1개로 운용한다(중복 토스트 방지).
export function useNewNotificationToast() {
  const { data: unread = 0 } = useUnreadCount();
  const navigate = useNavigate();
  const prev = useRef<number | null>(null);

  useEffect(() => {
    // 최초 로드(prev=null)는 기준선만 잡고 토스트 안 띄움 — 누적분에 놀라지 않게.
    if (prev.current !== null && unread > prev.current) {
      const delta = unread - prev.current;
      toast.message(`새 알림이 ${delta}건 도착했습니다.`, {
        action: { label: '보기', onClick: () => navigate(ROUTES.inbox) },
      });
    }
    prev.current = unread;
  }, [unread, navigate]);
}
