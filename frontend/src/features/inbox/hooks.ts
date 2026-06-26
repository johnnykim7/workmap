// 받은함 훅 — 목록(읽음/안읽음 필터) + 읽음 처리(낙관적 업데이트 + 서버 권위 재동기화).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@therecommerce/ds-ui';
import { inboxApi, type InboxResponse } from './api';

export type InboxFilter = 'all' | 'unread';

export const inboxKeys = {
  list: (filter: InboxFilter, page: number) => ['inbox', filter, page] as const,
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
