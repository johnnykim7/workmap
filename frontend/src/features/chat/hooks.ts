// 커뮤니케이션(채팅) 훅 — TanStack Query. 실시간은 폴링(refetchInterval 5s).
// 채널은 WS 단위 격리. 작성/수정/삭제/리액션 후 관련 쿼리 무효화.
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from '@therecommerce/ds-ui';
import { ApiError } from '@/lib/api-client';
import { chatApi } from './api';
import type {
  CreateChannelRequest,
  UpdateChannelRequest,
  CreateMessageRequest,
  CreateReplyRequest,
} from './types';

const POLL_MS = 5000;
const msg = (e: unknown, fb: string) => (e instanceof ApiError ? e.message : fb);

export const chatKeys = {
  channels: (wsId: number) => ['chat', 'channels', wsId] as const,
  channel: (id: number) => ['chat', 'channel', id] as const,
  messages: (cid: number) => ['chat', 'messages', cid] as const,
  replies: (cid: number, mid: number) => ['chat', 'replies', cid, mid] as const,
  members: (cid: number) => ['chat', 'members', cid] as const,
  pins: (cid: number) => ['chat', 'pins', cid] as const,
  bookmarks: () => ['chat', 'bookmarks'] as const,
  notiSettings: (cid: number) => ['chat', 'noti-settings', cid] as const,
};

// ── 채널 ──
export function useChannels(workspaceId: number | null) {
  return useQuery({
    queryKey: chatKeys.channels(workspaceId ?? 0),
    queryFn: () => chatApi.channels(workspaceId as number),
    enabled: workspaceId != null,
    refetchInterval: POLL_MS,
  });
}

export function useChannelMutations(workspaceId: number | null) {
  const qc = useQueryClient();
  const invalidate = () =>
    workspaceId != null && qc.invalidateQueries({ queryKey: chatKeys.channels(workspaceId) });

  const create = useMutation({
    mutationFn: (body: CreateChannelRequest) => chatApi.createChannel(body),
    onSuccess: () => { invalidate(); toast.success('채널을 생성했습니다.'); },
    onError: (e) => toast.error(msg(e, '채널 생성에 실패했습니다.')),
  });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateChannelRequest }) =>
      chatApi.updateChannel(id, body),
    onSuccess: () => { invalidate(); toast.success('채널을 수정했습니다.'); },
    onError: (e) => toast.error(msg(e, '채널 수정에 실패했습니다.')),
  });
  const remove = useMutation({
    mutationFn: (id: number) => chatApi.deleteChannel(id),
    onSuccess: () => { invalidate(); toast.success('채널을 삭제했습니다.'); },
    onError: (e) => toast.error(msg(e, '채널 삭제에 실패했습니다.')),
  });
  return { create, update, remove };
}

// ── 메시지 ──
export function useMessages(channelId: number | null) {
  return useQuery({
    queryKey: chatKeys.messages(channelId ?? 0),
    queryFn: () => chatApi.messages(channelId as number),
    enabled: channelId != null,
    refetchInterval: POLL_MS,
  });
}

export function useMessageMutations(channelId: number | null, workspaceId: number | null) {
  const qc = useQueryClient();
  const cid = channelId as number;
  const invalidateMessages = () =>
    channelId != null && qc.invalidateQueries({ queryKey: chatKeys.messages(cid) });
  const invalidateChannels = () =>
    workspaceId != null && qc.invalidateQueries({ queryKey: chatKeys.channels(workspaceId) });

  const send = useMutation({
    mutationFn: (body: CreateMessageRequest) => chatApi.createMessage(cid, body),
    onSuccess: () => { invalidateMessages(); invalidateChannels(); },
    onError: (e) => toast.error(msg(e, '메시지 전송에 실패했습니다.')),
  });
  const edit = useMutation({
    mutationFn: ({ mid, contentHtml }: { mid: number; contentHtml: string }) =>
      chatApi.updateMessage(cid, mid, contentHtml),
    onSuccess: () => { invalidateMessages(); toast.success('메시지를 수정했습니다.'); },
    onError: (e) => toast.error(msg(e, '메시지 수정에 실패했습니다.')),
  });
  const remove = useMutation({
    mutationFn: (mid: number) => chatApi.deleteMessage(cid, mid),
    onSuccess: () => { invalidateMessages(); toast.success('메시지를 삭제했습니다.'); },
    onError: (e) => toast.error(msg(e, '메시지 삭제에 실패했습니다.')),
  });
  const toggleReaction = useMutation({
    mutationFn: ({ mid, emoji }: { mid: number; emoji: string }) =>
      chatApi.toggleMessageReaction(cid, mid, emoji),
    onSuccess: () => invalidateMessages(),
    onError: (e) => toast.error(msg(e, '리액션 처리에 실패했습니다.')),
  });
  return { send, edit, remove, toggleReaction };
}

// 읽음 커서 — 마지막 메시지를 본 시점에 한 번 호출. 성공 시 채널 unread 갱신.
export function useReadCursor(channelId: number | null, workspaceId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (lastReadMessageId: number) =>
      chatApi.readCursor(channelId as number, lastReadMessageId),
    onSuccess: () =>
      workspaceId != null && qc.invalidateQueries({ queryKey: chatKeys.channels(workspaceId) }),
  });
}

// ── 답글(스레드) ──
export function useReplies(channelId: number | null, messageId: number | null) {
  return useQuery({
    queryKey: chatKeys.replies(channelId ?? 0, messageId ?? 0),
    queryFn: () => chatApi.replies(channelId as number, messageId as number),
    enabled: channelId != null && messageId != null,
    refetchInterval: POLL_MS,
  });
}

export function useReplyMutations(channelId: number | null, messageId: number | null) {
  const qc = useQueryClient();
  const cid = channelId as number;
  const mid = messageId as number;
  const invalidate = () => {
    if (channelId != null && messageId != null) {
      qc.invalidateQueries({ queryKey: chatKeys.replies(cid, mid) });
      qc.invalidateQueries({ queryKey: chatKeys.messages(cid) }); // replyCount 갱신
    }
  };

  const send = useMutation({
    mutationFn: (body: CreateReplyRequest) => chatApi.createReply(cid, mid, body),
    onSuccess: () => invalidate(),
    onError: (e) => toast.error(msg(e, '답글 전송에 실패했습니다.')),
  });
  const edit = useMutation({
    mutationFn: ({ rid, contentHtml }: { rid: number; contentHtml: string }) =>
      chatApi.updateReply(cid, mid, rid, contentHtml),
    onSuccess: () => { invalidate(); toast.success('답글을 수정했습니다.'); },
    onError: (e) => toast.error(msg(e, '답글 수정에 실패했습니다.')),
  });
  const remove = useMutation({
    mutationFn: (rid: number) => chatApi.deleteReply(cid, mid, rid),
    onSuccess: () => { invalidate(); toast.success('답글을 삭제했습니다.'); },
    onError: (e) => toast.error(msg(e, '답글 삭제에 실패했습니다.')),
  });
  const toggleReaction = useMutation({
    mutationFn: ({ rid, emoji }: { rid: number; emoji: string }) =>
      chatApi.toggleReplyReaction(cid, mid, rid, emoji),
    onSuccess: () => invalidate(),
    onError: (e) => toast.error(msg(e, '리액션 처리에 실패했습니다.')),
  });
  return { send, edit, remove, toggleReaction };
}

// ── 멤버 ──
export function useChannelMembers(channelId: number | null) {
  return useQuery({
    queryKey: chatKeys.members(channelId ?? 0),
    queryFn: () => chatApi.members(channelId as number),
    enabled: channelId != null,
  });
}

export function useMemberMutations(channelId: number | null) {
  const qc = useQueryClient();
  const cid = channelId as number;
  const invalidate = () =>
    channelId != null && qc.invalidateQueries({ queryKey: chatKeys.members(cid) });

  const add = useMutation({
    mutationFn: (userId: number) => chatApi.addMember(cid, userId),
    onSuccess: () => { invalidate(); toast.success('멤버를 추가했습니다.'); },
    onError: (e) => toast.error(msg(e, '멤버 추가에 실패했습니다.')),
  });
  const remove = useMutation({
    mutationFn: (userId: number) => chatApi.removeMember(cid, userId),
    onSuccess: () => { invalidate(); toast.success('멤버를 제외했습니다.'); },
    onError: (e) => toast.error(msg(e, '멤버 제외에 실패했습니다.')),
  });
  return { add, remove };
}

// ── 핀 ──
export function usePins(channelId: number | null) {
  return useQuery({
    queryKey: chatKeys.pins(channelId ?? 0),
    queryFn: () => chatApi.pins(channelId as number),
    enabled: channelId != null,
  });
}

export function usePinMutations(channelId: number | null) {
  const qc = useQueryClient();
  const cid = channelId as number;
  const invalidate = () => {
    if (channelId != null) {
      qc.invalidateQueries({ queryKey: chatKeys.pins(cid) });
      qc.invalidateQueries({ queryKey: chatKeys.messages(cid) });
    }
  };
  const pin = useMutation({
    mutationFn: (mid: number) => chatApi.pin(cid, mid),
    onSuccess: () => { invalidate(); toast.success('메시지를 고정했습니다.'); },
    onError: (e) => toast.error(msg(e, '고정에 실패했습니다.')),
  });
  const unpin = useMutation({
    mutationFn: (mid: number) => chatApi.unpin(cid, mid),
    onSuccess: () => { invalidate(); toast.success('고정을 해제했습니다.'); },
    onError: (e) => toast.error(msg(e, '고정 해제에 실패했습니다.')),
  });
  return { pin, unpin };
}

// ── 북마크 ──
export function useBookmarks() {
  return useQuery({ queryKey: chatKeys.bookmarks(), queryFn: () => chatApi.bookmarks() });
}

export function useBookmarkMutations(channelId: number | null) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: chatKeys.bookmarks() });
    if (channelId != null) qc.invalidateQueries({ queryKey: chatKeys.messages(channelId) });
  };
  const add = useMutation({
    mutationFn: (mid: number) => chatApi.addBookmark(mid),
    onSuccess: () => { invalidate(); toast.success('북마크에 추가했습니다.'); },
    onError: (e) => toast.error(msg(e, '북마크 추가에 실패했습니다.')),
  });
  const remove = useMutation({
    mutationFn: (mid: number) => chatApi.removeBookmark(mid),
    onSuccess: () => { invalidate(); toast.success('북마크를 해제했습니다.'); },
    onError: (e) => toast.error(msg(e, '북마크 해제에 실패했습니다.')),
  });
  return { add, remove };
}

// ── 알림 설정 ──
export function useNotificationSettings(channelId: number | null) {
  return useQuery({
    queryKey: chatKeys.notiSettings(channelId ?? 0),
    queryFn: () => chatApi.notificationSettings(channelId as number),
    enabled: channelId != null,
  });
}

export function useUpdateNotificationSettings(channelId: number | null) {
  const qc = useQueryClient();
  const cid = channelId as number;
  return useMutation({
    mutationFn: (body: { notifyLevel: string; muteUntil?: string | null }) =>
      chatApi.updateNotificationSettings(cid, body),
    onSuccess: () => {
      if (channelId != null) qc.invalidateQueries({ queryKey: chatKeys.notiSettings(cid) });
      toast.success('알림 설정을 저장했습니다.');
    },
    onError: (e) => toast.error(msg(e, '알림 설정 저장에 실패했습니다.')),
  });
}
