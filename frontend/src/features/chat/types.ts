// 커뮤니케이션(채팅) 도메인 타입 — BE /chat/* 계약 기준(Slack 유사).
// 채널 단위는 워크스페이스(WS)에 격리. 메시지 본문은 Tiptap HTML(contentHtml).

/** 채널 종류 — 시스템 채널(전체공지 등)은 삭제/이름변경 제한 가능. */
export type ChannelKind = 'SYSTEM' | 'GENERAL';

export interface ChatChannel {
  id: number;
  workspaceId: number;
  name: string; // 슬러그/식별용
  displayName: string; // 화면 표시명
  description: string | null;
  kind: ChannelKind | string;
  unreadCount: number;
  memberCount?: number;
  createdAt: string;
}

/** 메시지/답글 공통 리액션 요약. */
export interface ReactionSummary {
  emoji: string;
  count: number;
  userIds: number[];
}

export interface ChatMessage {
  id: number;
  channelId: number;
  authorId: number;
  authorName: string;
  contentHtml: string;
  reactions: ReactionSummary[];
  mentionedUserIds?: number[];
  replyCount?: number;
  pinned?: boolean;
  bookmarked?: boolean;
  editedAt?: string | null;
  createdAt: string;
}

export interface ChatReply {
  id: number;
  messageId: number;
  authorId: number;
  authorName: string;
  contentHtml: string;
  reactions: ReactionSummary[];
  editedAt?: string | null;
  createdAt: string;
}

// 채널 멤버 응답 계약(BE MemberResponse) — userName 조인, email 미제공.
export interface ChatMember {
  userId: number;
  userName: string;
  role?: string;
  joinedAt?: string;
}

export interface ChatBookmark {
  messageId: number;
  channelId: number;
  channelDisplayName?: string;
  authorName?: string;
  contentHtml?: string;
  createdAt: string;
}

export type NotifyLevel = 'ALL' | 'MENTIONS' | 'NONE';

export interface NotificationSettings {
  channelId: number;
  notifyLevel: NotifyLevel | string;
  muteUntil: string | null;
}

// ── 요청 바디 ──
export interface CreateChannelRequest {
  workspaceId: number;
  name: string;
  displayName: string;
  description?: string | null;
}
export interface UpdateChannelRequest {
  displayName?: string;
  description?: string | null;
}
export interface CreateMessageRequest {
  workspaceId: number;
  contentHtml: string;
  mentionedUserIds?: number[];
}
export interface CreateReplyRequest {
  workspaceId: number;
  contentHtml: string;
}

/** 고정 이모지 셋(간단 피커). */
export const EMOJI_SET = ['👍', '❤️', '😄', '🎉', '👀', '✅'] as const;
