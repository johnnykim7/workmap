// 단일 메시지 아이템 — 아바타 + 작성자 + 시각 + 본문(Tiptap HTML) + 리액션 + hover 액션.
// hover 액션: 리액션·북마크·스레드 열기·(본인) 수정/삭제·핀.
// contentHtml은 BE 화이트리스트 + Tiptap 생성 HTML이므로 dangerouslySetInnerHTML 허용(CR-024).
import { useState } from 'react';
import { Avatar, AvatarFallback, Button, cn } from '@therecommerce/ds-ui';
import {
  MessageSquareText,
  Bookmark,
  BookmarkCheck,
  Pin,
  PinOff,
  Pencil,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import { RichTextEditor } from '@/components/common/rich-text-editor';
import type { ChatMessage } from '../types';
import { ReactionBar } from './ReactionBar';
import { formatChatTime, initialOf, isEmptyHtml } from './chat-utils';

interface Props {
  message: ChatMessage;
  currentUserId?: number;
  onToggleReaction: (emoji: string) => void;
  onOpenThread: () => void;
  onToggleBookmark: () => void;
  onTogglePin: () => void;
  onEdit: (contentHtml: string) => void;
  onDelete: () => void;
}

export function MessageItem({
  message,
  currentUserId,
  onToggleReaction,
  onOpenThread,
  onToggleBookmark,
  onTogglePin,
  onEdit,
  onDelete,
}: Props) {
  const mine = currentUserId != null && message.authorId === currentUserId;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.contentHtml);

  const saveEdit = () => {
    if (isEmptyHtml(draft)) return;
    onEdit(draft);
    setEditing(false);
  };

  return (
    <div className="group relative flex gap-3 rounded-md px-2 py-1.5 hover:bg-muted/40">
      <Avatar className="mt-0.5 size-8 shrink-0">
        <AvatarFallback className="text-xs">{initialOf(message.authorName)}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-foreground">{message.authorName}</span>
          <span className="text-xs text-muted-foreground">{formatChatTime(message.createdAt)}</span>
          {message.editedAt && <span className="text-xs text-muted-foreground">(수정됨)</span>}
          {message.pinned && (
            <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
              <Pin className="size-3" /> 고정
            </span>
          )}
        </div>

        {editing ? (
          <div className="mt-1 space-y-1.5">
            <div className="rounded-md border border-border">
              <RichTextEditor value={message.contentHtml} onChange={setDraft} />
            </div>
            <div className="flex gap-1.5">
              <Button variant="primary" size="sm" onClick={saveEdit} disabled={isEmptyHtml(draft)}>
                <Check className="size-4" /> 저장
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setDraft(message.contentHtml); }}>
                <X className="size-4" /> 취소
              </Button>
            </div>
          </div>
        ) : (
          <div
            className="tiptap prose-sm mt-0.5 max-w-none text-sm text-foreground"
            // eslint-disable-next-line react/no-danger -- Tiptap 생성 + BE 화이트리스트 HTML(CR-024)
            dangerouslySetInnerHTML={{ __html: message.contentHtml }}
          />
        )}

        <div className="mt-1 flex flex-wrap items-center gap-2">
          <ReactionBar
            reactions={message.reactions ?? []}
            currentUserId={currentUserId}
            onToggle={onToggleReaction}
          />
          <button
            type="button"
            onClick={onOpenThread}
            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
          >
            <MessageSquareText className="size-3.5" />
            {message.replyCount ? `답글 ${message.replyCount}` : '스레드'}
          </button>
        </div>
      </div>

      {/* hover 액션 — 우상단 부유 */}
      {!editing && (
        <div
          className={cn(
            'absolute right-2 top-1 hidden items-center gap-0.5 rounded-md border border-border bg-background p-0.5 shadow-sm',
            'group-hover:flex',
          )}
        >
          <Button variant="ghost" size="icon" className="size-7" onClick={onToggleBookmark} aria-label="북마크">
            {message.bookmarked ? <BookmarkCheck className="size-4 text-primary" /> : <Bookmark className="size-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="size-7" onClick={onTogglePin} aria-label="고정">
            {message.pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
          </Button>
          {mine && (
            <>
              <Button variant="ghost" size="icon" className="size-7" onClick={() => setEditing(true)} aria-label="수정">
                <Pencil className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" className="size-7" onClick={onDelete} aria-label="삭제">
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
