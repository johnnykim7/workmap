// 중앙 패널 — 채널 헤더(설정 …메뉴) + 메시지 목록(스켈레톤·5s 폴링) + 작성기.
// 마지막 메시지를 보면 read-cursor PUT(채널당 1회/마지막 id 변동 시).
import { useEffect, useRef, useState } from 'react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Skeleton,
  cn,
} from '@therecommerce/ds-ui';
import { Hash, Lock, MoreHorizontal, Users, Pin, Bell, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { EmptyState } from '@/components/common/empty-state';
import type { ChatChannel, ChatMessage } from '../types';
import {
  useMessages,
  useMessageMutations,
  useReadCursor,
  useChannelMutations,
  useBookmarkMutations,
  usePinMutations,
} from '../hooks';
import { MessageItem } from './MessageItem';
import { MessageComposer } from './MessageComposer';
import { MembersDialog, PinsDialog, NotificationSettingsDialog } from './ChannelDialogs';

interface Props {
  channel: ChatChannel | null;
  workspaceId: number | null;
  currentUserId?: number;
  onOpenThread: (m: ChatMessage) => void;
  onChannelDeleted: () => void;
}

export function MessagePane({
  channel,
  workspaceId,
  currentUserId,
  onOpenThread,
  onChannelDeleted,
}: Props) {
  const channelId = channel?.id ?? null;
  const { data: messages = [], isPending } = useMessages(channelId);
  const { send, edit, remove, toggleReaction } = useMessageMutations(channelId, workspaceId);
  const { remove: removeChannel } = useChannelMutations(workspaceId);
  const { add: addBookmark, remove: removeBookmark } = useBookmarkMutations(channelId);
  const { pin, unpin } = usePinMutations(channelId);
  const readCursor = useReadCursor(channelId, workspaceId);

  const [membersOpen, setMembersOpen] = useState(false);
  const [pinsOpen, setPinsOpen] = useState(false);
  const [notiOpen, setNotiOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);
  const lastCursorRef = useRef<number | null>(null);

  // 마지막 메시지 변동 시 읽음 커서 + 맨 아래로 스크롤.
  const lastId = messages.length ? messages[messages.length - 1].id : null;
  useEffect(() => {
    if (channelId == null || lastId == null) return;
    if (lastCursorRef.current !== lastId) {
      lastCursorRef.current = lastId;
      readCursor.mutate(lastId);
      endRef.current?.scrollIntoView({ block: 'end' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, lastId]);

  // 채널 전환 시 커서 추적 리셋.
  useEffect(() => {
    lastCursorRef.current = null;
  }, [channelId]);

  if (!channel) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <EmptyState
          icon={<Hash className="size-8" />}
          title="채널을 선택하세요"
          description="좌측에서 채널을 선택하거나 새 채널을 만드세요."
        />
      </div>
    );
  }

  const Icon = channel.kind === 'SYSTEM' ? Lock : Hash;

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {/* 헤더 */}
      <header className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <Icon className="size-4 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-foreground">{channel.displayName}</div>
          {channel.description && (
            <div className="truncate text-xs text-muted-foreground">{channel.description}</div>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8" aria-label="채널 설정">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onSelect={() => setMembersOpen(true)}>
              <Users className="size-4" /> 멤버
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setPinsOpen(true)}>
              <Pin className="size-4" /> 고정 메시지
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setNotiOpen(true)}>
              <Bell className="size-4" /> 알림 설정
            </DropdownMenuItem>
            {channel.kind !== 'SYSTEM' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setDeleteOpen(true)} className="text-destructive">
                  <Trash2 className="size-4" /> 채널 삭제
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* 메시지 목록 */}
      <div className={cn('flex-1 overflow-y-auto px-2 py-3')}>
        {isPending ? (
          <div className="space-y-3 px-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="size-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <EmptyState
              icon={<Hash className="size-8" />}
              title="첫 메시지를 남겨보세요"
              description="이 채널에는 아직 메시지가 없습니다."
            />
          </div>
        ) : (
          <div className="space-y-0.5">
            {messages.map((m) => (
              <MessageItem
                key={m.id}
                message={m}
                currentUserId={currentUserId}
                onToggleReaction={(emoji) => toggleReaction.mutate({ mid: m.id, emoji })}
                onOpenThread={() => onOpenThread(m)}
                onToggleBookmark={() =>
                  m.bookmarked ? removeBookmark.mutate(m.id) : addBookmark.mutate(m.id)
                }
                onTogglePin={() => (m.pinned ? unpin.mutate(m.id) : pin.mutate(m.id))}
                onEdit={(contentHtml) => edit.mutate({ mid: m.id, contentHtml })}
                onDelete={() => remove.mutate(m.id)}
              />
            ))}
            <div ref={endRef} />
          </div>
        )}
      </div>

      {/* 작성기 */}
      <div className="border-t border-border p-3">
        <MessageComposer
          placeholder={`#${channel.displayName} 에 메시지`}
          busy={send.isPending}
          onSend={(contentHtml) =>
            workspaceId != null && send.mutate({ workspaceId, contentHtml })
          }
        />
      </div>

      {/* 다이얼로그 */}
      <MembersDialog open={membersOpen} onOpenChange={setMembersOpen} channelId={channel.id} />
      <PinsDialog open={pinsOpen} onOpenChange={setPinsOpen} channelId={channel.id} onOpenMessage={onOpenThread} />
      <NotificationSettingsDialog open={notiOpen} onOpenChange={setNotiOpen} channelId={channel.id} />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="채널을 삭제할까요?"
        description="채널과 모든 메시지가 삭제됩니다. 되돌릴 수 없습니다."
        confirmLabel="삭제"
        busy={removeChannel.isPending}
        onConfirm={() =>
          removeChannel.mutate(channel.id, {
            onSuccess: () => {
              setDeleteOpen(false);
              onChannelDeleted();
            },
          })
        }
      />
    </div>
  );
}
