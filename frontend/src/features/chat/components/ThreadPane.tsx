// 우측 스레드 패널 — 부모 메시지 + 답글 목록(5s 폴링) + 답글 작성기.
import { useState } from 'react';
import { Avatar, AvatarFallback, Button, Skeleton, cn } from '@therecommerce/ds-ui';
import { X, Check, Pencil, Trash2 } from 'lucide-react';
import { RichTextEditor } from '@/components/common/rich-text-editor';
import type { ChatMessage, ChatReply } from '../types';
import { useReplies, useReplyMutations } from '../hooks';
import { ReactionBar } from './ReactionBar';
import { MessageComposer } from './MessageComposer';
import { formatChatTime, initialOf, isEmptyHtml } from './chat-utils';

interface Props {
  channelId: number;
  parent: ChatMessage;
  workspaceId: number | null;
  currentUserId?: number;
  onClose: () => void;
}

export function ThreadPane({ channelId, parent, workspaceId, currentUserId, onClose }: Props) {
  const { data: replies = [], isPending } = useReplies(channelId, parent.id);
  const { send, edit, remove, toggleReaction } = useReplyMutations(channelId, parent.id);

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-l border-border">
      <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <span className="text-sm font-semibold text-foreground">스레드</span>
        <Button variant="ghost" size="icon" className="size-7" aria-label="스레드 닫기" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto px-2 py-3">
        {/* 부모 메시지 */}
        <div className="mb-2 rounded-md border border-border bg-muted/30 px-2 py-2">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold">{parent.authorName}</span>
            <span className="text-xs text-muted-foreground">{formatChatTime(parent.createdAt)}</span>
          </div>
          <div
            className="tiptap mt-0.5 text-sm text-foreground"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: parent.contentHtml }}
          />
        </div>

        <div className="mb-1 px-1 text-xs text-muted-foreground">
          답글 {replies.length}
        </div>

        {isPending ? (
          <Skeleton className="h-12 w-full" />
        ) : (
          <div className="space-y-0.5">
            {replies.map((r) => (
              <ReplyItem
                key={r.id}
                reply={r}
                currentUserId={currentUserId}
                onToggleReaction={(emoji) => toggleReaction.mutate({ rid: r.id, emoji })}
                onEdit={(contentHtml) => edit.mutate({ rid: r.id, contentHtml })}
                onDelete={() => remove.mutate(r.id)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border p-3">
        <MessageComposer
          placeholder="답글 남기기"
          busy={send.isPending}
          onSend={(contentHtml) => workspaceId != null && send.mutate({ workspaceId, contentHtml })}
        />
      </div>
    </aside>
  );
}

function ReplyItem({
  reply,
  currentUserId,
  onToggleReaction,
  onEdit,
  onDelete,
}: {
  reply: ChatReply;
  currentUserId?: number;
  onToggleReaction: (emoji: string) => void;
  onEdit: (contentHtml: string) => void;
  onDelete: () => void;
}) {
  const mine = currentUserId != null && reply.authorId === currentUserId;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(reply.contentHtml);

  const save = () => {
    if (isEmptyHtml(draft)) return;
    onEdit(draft);
    setEditing(false);
  };

  return (
    <div className="group relative flex gap-2 rounded-md px-1.5 py-1.5 hover:bg-muted/40">
      <Avatar className="mt-0.5 size-6 shrink-0">
        <AvatarFallback className="text-[10px]">{initialOf(reply.authorName)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-semibold text-foreground">{reply.authorName}</span>
          <span className="text-[11px] text-muted-foreground">{formatChatTime(reply.createdAt)}</span>
          {reply.editedAt && <span className="text-[11px] text-muted-foreground">(수정됨)</span>}
        </div>
        {editing ? (
          <div className="mt-1 space-y-1.5">
            <div className="rounded-md border border-border">
              <RichTextEditor value={reply.contentHtml} onChange={setDraft} />
            </div>
            <div className="flex gap-1.5">
              <Button variant="primary" size="sm" onClick={save} disabled={isEmptyHtml(draft)}>
                <Check className="size-4" /> 저장
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setDraft(reply.contentHtml); }}>
                취소
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div
              className="tiptap mt-0.5 text-sm text-foreground"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: reply.contentHtml }}
            />
            <div className="mt-1">
              <ReactionBar
                reactions={reply.reactions ?? []}
                currentUserId={currentUserId}
                onToggle={onToggleReaction}
              />
            </div>
          </>
        )}
      </div>

      {mine && !editing && (
        <div className={cn('absolute right-1 top-1 hidden gap-0.5 rounded-md border border-border bg-background p-0.5 group-hover:flex')}>
          <Button variant="ghost" size="icon" className="size-6" onClick={() => setEditing(true)} aria-label="수정">
            <Pencil className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="size-6" onClick={onDelete} aria-label="삭제">
            <Trash2 className="size-3.5 text-destructive" />
          </Button>
        </div>
      )}
    </div>
  );
}
