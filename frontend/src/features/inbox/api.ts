// 받은함/알림 API (T3-2 §I·L, WMP-NOTI-001) — 실 BE 계약 기준.
// /inbox = 목록(PageResponse) + 안읽음 배지(unreadCount) 통합(CR-011). 읽음은 /notifications/{id}/read.
import { api, type PageResponse } from '@/lib/api-client';

// BE Notification.type 발행값(NotificationEventListener, CR-028 확장 11종).
export type NotificationType =
  | 'ASSIGNED'
  | 'MENTIONED'
  | 'BLOCKED'
  | 'DUE_APPROACHING'
  | 'OVERDUE'
  | 'COMMENTED'
  | 'STATUS_CHANGED'
  | 'SPRINT_STARTED'
  | 'SPRINT_COMPLETED'
  | 'APPROVAL_REQUESTED'
  | 'APPROVAL_DECIDED';

// BE NotificationDtos.Response.
export interface NotificationItem {
  id: number;
  type: NotificationType | string;
  workItemId: number | null;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// BE InboxDtos.Response — 목록 + 안읽음 배지.
export interface InboxResponse {
  notifications: PageResponse<NotificationItem>;
  unreadCount: number;
}

function qs(isRead: boolean | undefined, page: number, size: number) {
  const p = new URLSearchParams({ page: String(page), size: String(size) });
  if (isRead != null) p.set('isRead', String(isRead));
  return p.toString();
}

export const inboxApi = {
  // 받은함(목록 + 배지). isRead 미지정=전체.
  inbox: (isRead?: boolean, page = 0, size = 20) =>
    api.get<InboxResponse>(`/inbox?${qs(isRead, page, size)}`),
  // 알림 읽음 처리(WMP-NOTI-001).
  markRead: (id: number) => api.patch<void>(`/notifications/${id}/read`),
};
