// 커뮤니케이션(채팅) API — BE /chat/* 계약. api-client BASE_URL=/api/v1 이므로 경로는 /chat/...
import { api } from '@/lib/api-client';
import type {
  ChatChannel,
  ChatMessage,
  ChatReply,
  ChatMember,
  ChatBookmark,
  NotificationSettings,
  CreateChannelRequest,
  UpdateChannelRequest,
  CreateMessageRequest,
  CreateReplyRequest,
} from './types';

export const chatApi = {
  // ── 채널 ──
  channels: (workspaceId: number) =>
    api.get<ChatChannel[]>(`/chat/channels?workspaceId=${workspaceId}`),
  channel: (id: number) => api.get<ChatChannel>(`/chat/channels/${id}`),
  createChannel: (body: CreateChannelRequest) =>
    api.post<ChatChannel>('/chat/channels', body),
  updateChannel: (id: number, body: UpdateChannelRequest) =>
    api.put<ChatChannel>(`/chat/channels/${id}`, body),
  deleteChannel: (id: number) => api.delete<void>(`/chat/channels/${id}`),

  // ── 메시지 ──
  messages: (cid: number) => api.get<ChatMessage[]>(`/chat/channels/${cid}/messages`),
  createMessage: (cid: number, body: CreateMessageRequest) =>
    api.post<ChatMessage>(`/chat/channels/${cid}/messages`, body),
  updateMessage: (cid: number, mid: number, contentHtml: string) =>
    api.put<ChatMessage>(`/chat/channels/${cid}/messages/${mid}`, { contentHtml }),
  deleteMessage: (cid: number, mid: number) =>
    api.delete<void>(`/chat/channels/${cid}/messages/${mid}`),

  // ── 답글(스레드) ──
  replies: (cid: number, mid: number) =>
    api.get<ChatReply[]>(`/chat/channels/${cid}/messages/${mid}/replies`),
  createReply: (cid: number, mid: number, body: CreateReplyRequest) =>
    api.post<ChatReply>(`/chat/channels/${cid}/messages/${mid}/replies`, body),
  updateReply: (cid: number, mid: number, rid: number, contentHtml: string) =>
    api.put<ChatReply>(`/chat/channels/${cid}/messages/${mid}/replies/${rid}`, { contentHtml }),
  deleteReply: (cid: number, mid: number, rid: number) =>
    api.delete<void>(`/chat/channels/${cid}/messages/${mid}/replies/${rid}`),

  // ── 리액션(토글, 요약 반환) ──
  toggleMessageReaction: (cid: number, mid: number, emoji: string) =>
    api.post<ChatMessage>(`/chat/channels/${cid}/messages/${mid}/reactions`, { emoji }),
  toggleReplyReaction: (cid: number, mid: number, rid: number, emoji: string) =>
    api.post<ChatReply>(`/chat/channels/${cid}/messages/${mid}/replies/${rid}/reactions`, { emoji }),

  // ── 읽음 커서 ──
  readCursor: (cid: number, lastReadMessageId: number) =>
    api.put<void>(`/chat/channels/${cid}/read-cursor`, { lastReadMessageId }),

  // ── 멤버 ──
  members: (cid: number) => api.get<ChatMember[]>(`/chat/channels/${cid}/members`),
  addMember: (cid: number, userId: number) =>
    api.post<void>(`/chat/channels/${cid}/members`, { userId }),
  removeMember: (cid: number, userId: number) =>
    api.delete<void>(`/chat/channels/${cid}/members/${userId}`),

  // ── 핀 ──
  pins: (cid: number) => api.get<ChatMessage[]>(`/chat/channels/${cid}/pins`),
  pin: (cid: number, mid: number) =>
    api.post<void>(`/chat/channels/${cid}/messages/${mid}/pin`),
  unpin: (cid: number, mid: number) =>
    api.delete<void>(`/chat/channels/${cid}/messages/${mid}/pin`),

  // ── 북마크 ──
  bookmarks: () => api.get<ChatBookmark[]>('/chat/bookmarks'),
  addBookmark: (mid: number) => api.post<void>(`/chat/bookmarks/${mid}`),
  removeBookmark: (mid: number) => api.delete<void>(`/chat/bookmarks/${mid}`),

  // ── 알림 설정 ──
  notificationSettings: (cid: number) =>
    api.get<NotificationSettings>(`/chat/channels/${cid}/notification-settings`),
  updateNotificationSettings: (
    cid: number,
    body: { notifyLevel: string; muteUntil?: string | null },
  ) => api.put<NotificationSettings>(`/chat/channels/${cid}/notification-settings`, body),
};
