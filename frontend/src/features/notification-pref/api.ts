// 알림 수신 설정 + FCM 토큰 API (T3-2 §L, WMP-NOTI-003·004, CR-028) — 실 BE 계약 기준.
// GET/PUT /notification-preferences (종류 × 채널 on/off), POST/DELETE /fcm/token.
import { api } from '@/lib/api-client';

// BE NotificationType(11종). 발행/설정 도메인 단일 출처.
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

// 한글 라벨(매트릭스 행 표시). BE enum과 1:1.
export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  ASSIGNED: '업무 배정',
  MENTIONED: '댓글 멘션',
  BLOCKED: '업무 막힘',
  DUE_APPROACHING: '마감 임박',
  OVERDUE: '마감 초과',
  COMMENTED: '새 댓글',
  STATUS_CHANGED: '상태 변경',
  SPRINT_STARTED: '스프린트 시작',
  SPRINT_COMPLETED: '스프린트 완료',
  APPROVAL_REQUESTED: '승인 요청',
  APPROVAL_DECIDED: '승인 처리',
};

// BE NotificationPreferenceDtos.Item.
export interface PreferenceItem {
  type: string;
  inApp: boolean;
  email: boolean;
  push: boolean;
}

export interface PreferenceListResponse {
  items: PreferenceItem[];
}

export const notificationPrefApi = {
  // 내 수신 설정(전체 종류 × 채널, 미설정은 기본값 머지).
  list: () => api.get<PreferenceListResponse>('/notification-preferences'),
  // 부분 upsert — 변경된 종류만 보낸다.
  update: (items: PreferenceItem[]) =>
    api.put<void>('/notification-preferences', { items }),
  // FCM 토큰 등록/삭제(로그인/로그아웃 시).
  registerFcmToken: (fcmToken: string, deviceInfo?: string) =>
    api.post<void>('/fcm/token', { fcmToken, deviceInfo }),
  deleteFcmToken: (fcmToken: string) =>
    api.delete<void>('/fcm/token', { fcmToken }),
};
