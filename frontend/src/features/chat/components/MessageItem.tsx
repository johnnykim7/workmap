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
import { ReactionChips, EmojiPicker } from './ReactionBar';
import { formatChatTime, initialOf, isEmptyHtml } from './chat-utils';

interface Props {
  message: ChatMessage;
  /** 직전 메시지와 같은 작성자(연속) — 아바타·이름 생략하고 컴팩트하게. */
  grouped?: boolean;
  /** 그루핑이어도 분이 바뀌어 시각은 표시해야 할 때. */
  groupedShowTime?: boolean;
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
  grouped = false,
  groupedShowTime = false,
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

  const hasReplies = (message.replyCount ?? 0) > 0;

  return (
    <div
      className={cn(
        'group relative flex gap-3 px-2 hover:bg-muted/40',
        grouped ? 'py-0.5' : 'mt-2 py-0.5 first:mt-0',
      )}
    >
      {/* 그루핑이면 아바타 자리(size-8)만 비움 */}
      {grouped ? (
        <div className="w-8 shrink-0" aria-hidden />
      ) : (
        <Avatar className="mt-0.5 size-8 shrink-0">
          <AvatarFallback className="text-xs">{initialOf(message.authorName)}</AvatarFallback>
        </Avatar>
      )}

      <div className="min-w-0 flex-1">
        {!grouped ? (
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
        ) : (
          // 그루핑이어도 분이 바뀌면 시각만 한 줄(이름 자리 톤). 분이 같으면 아무것도 안 띄움.
          groupedShowTime && (
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-muted-foreground">{formatChatTime(message.createdAt)}</span>
              {message.editedAt && <span className="text-xs text-muted-foreground">(수정됨)</span>}
            </div>
          )
        )}

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
            className="tiptap prose-sm max-w-none text-sm text-foreground"
            // eslint-disable-next-line react/no-danger -- Tiptap 생성 + BE 화이트리스트 HTML(CR-024)
            dangerouslySetInnerHTML={{ __html: message.contentHtml }}
          />
        )}

        {/* 달린 리액션 칩 — 본문 아래 항상(레이아웃 안 밀림). 없으면 아무것도 안 그림. */}
        {!editing && (
          <ReactionChips
            reactions={message.reactions ?? []}
            currentUserId={currentUserId}
            onToggle={onToggleReaction}
          />
        )}

        {/* 답글이 실제로 있을 때만 스레드 요약(Slack식 "답글 N"). */}
        {!editing && hasReplies && (
          <button
            type="button"
            onClick={onOpenThread}
            className="mt-1 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium text-primary outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
          >
            <MessageSquareText className="size-3.5" />
            답글 {message.replyCount}
          </button>
        )}
      </div>

      {/* hover 툴바 — 행 우상단 안쪽에 부유. -top-3로 행 밖에 두면 마우스가 본문→툴바로 갈 때
          group 경계를 넘어 hover가 풀린다(포커스 잃음). 행 안쪽(top-0)에 두어 group-hover 유지. */}
      {!editing && (
        <div className="absolute right-2 top-0 z-10 hidden items-center gap-0.5 rounded-md border border-border bg-background p-0.5 shadow-sm group-hover:flex">
          <EmojiPicker onPick={onToggleReaction} />
          <Button variant="ghost" size="icon" className="size-7" onClick={onOpenThread} aria-label="스레드">
            <MessageSquareText className="size-4" />
          </Button>
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
