// 커뮤니케이션(채팅) 페이지 — 채널은 전역 LNB '메시지' 메뉴 children으로 나열되고,
// 이 페이지는 메시지 + 스레드 2패널을 그린다(채널 사이드바 제거, CR-026).
// 채널은 현재 선택된 워크스페이스(WS) 단위로 격리(useWorkspaceStore).
// 선택 채널은 URL(/chat/:channelId)에 반영 — 새로고침/공유 시 유지.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '@/store/auth-store';
import { useWorkspaceStore } from '@/store/workspace-store';
import { ROUTES } from '@/lib/route-paths';
import { useChannels } from '@/features/chat/hooks';
import { MessagePane } from '@/features/chat/components/MessagePane';
import { ThreadPane } from '@/features/chat/components/ThreadPane';
import { ResizeDivider } from '@/features/chat/components/ResizeDivider';
import { CreateChannelDialog } from '@/features/chat/components/CreateChannelDialog';
import type { ChatMessage } from '@/features/chat/types';

// 스레드 패널 너비(px) — 좌측 경계 드래그로 조절, 새로고침 유지(localStorage).
const THREAD_MIN = 280;
const THREAD_MAX = 720;
const THREAD_DEFAULT = 320;
const THREAD_WIDTH_KEY = 'workmap-chat-thread-width';

function loadThreadWidth(): number {
  const raw = Number(localStorage.getItem(THREAD_WIDTH_KEY));
  if (!raw || Number.isNaN(raw)) return THREAD_DEFAULT;
  return Math.min(THREAD_MAX, Math.max(THREAD_MIN, raw));
}

export function ChatPage() {
  const navigate = useNavigate();
  const { channelId: channelIdParam } = useParams();
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const currentUserId = useAuthStore((s) => s.user?.id);

  const { data: channels = [], isPending } = useChannels(workspaceId);

  const selectedId = channelIdParam ? Number(channelIdParam) : null;
  const selectedChannel = useMemo(
    () => channels.find((c) => c.id === selectedId) ?? null,
    [channels, selectedId],
  );

  const [threadParent, setThreadParent] = useState<ChatMessage | null>(null);
  const [threadWidth, setThreadWidth] = useState(loadThreadWidth);
  const [createOpen, setCreateOpen] = useState(false);

  // 스레드 너비 변경을 localStorage에 저장(새로고침 유지).
  useEffect(() => {
    localStorage.setItem(THREAD_WIDTH_KEY, String(threadWidth));
  }, [threadWidth]);

  // 선택 채널이 없는데 채널이 있으면 첫 채널로 진입(편의).
  useEffect(() => {
    if (selectedId == null && channels.length > 0) {
      navigate(ROUTES.chatChannel(channels[0].id), { replace: true });
    }
  }, [selectedId, channels, navigate]);

  // 채널이 바뀌면 열린 스레드 닫기.
  useEffect(() => {
    setThreadParent(null);
  }, [selectedId]);

  // WS가 바뀌면 채널 목록으로 리셋.
  useEffect(() => {
    // workspaceId 변동 시 잘못된 채널 선택을 정리.
    if (selectedId != null && !isPending && channels.length > 0 && !selectedChannel) {
      navigate(ROUTES.chat, { replace: true });
    }
  }, [workspaceId, selectedId, isPending, channels, selectedChannel, navigate]);

  return (
    // AppShell의 p-5 패딩을 상쇄해 풀-블리드 2패널 — 채팅은 화면을 꽉 채운다.
    <div className="-m-5 flex h-[calc(100vh-3.5rem)] overflow-hidden">
      <MessagePane
        channel={selectedChannel}
        workspaceId={workspaceId}
        currentUserId={currentUserId}
        hasChannels={channels.length > 0}
        loadingChannels={isPending}
        onOpenThread={setThreadParent}
        onCreateChannel={() => setCreateOpen(true)}
        onChannelDeleted={() => navigate(ROUTES.chat, { replace: true })}
      />

      {selectedChannel && threadParent && (
        <>
          {/* 좌측 경계 드래그 → 왼쪽으로 끌면 넓어지므로 width - delta */}
          <ResizeDivider
            aria-label="스레드 패널 크기 조절"
            onDrag={(delta) =>
              setThreadWidth((w) =>
                Math.min(THREAD_MAX, Math.max(THREAD_MIN, w - delta)),
              )
            }
          />
          <ThreadPane
            channelId={selectedChannel.id}
            parent={threadParent}
            workspaceId={workspaceId}
            currentUserId={currentUserId}
            width={threadWidth}
            onClose={() => setThreadParent(null)}
          />
        </>
      )}

      <CreateChannelDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        workspaceId={workspaceId}
        onCreated={(id) => navigate(ROUTES.chatChannel(id))}
      />
    </div>
  );
}
