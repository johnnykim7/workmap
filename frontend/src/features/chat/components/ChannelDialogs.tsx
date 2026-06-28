// 채널 설정 다이얼로그 묶음 — 멤버 / 핀 / 알림설정. ds-ui Dialog 기반.
import { useEffect, useState } from 'react';
import {
  Avatar,
  AvatarFallback,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from '@therecommerce/ds-ui';
import { Search, UserPlus, X } from 'lucide-react';
import { Field } from '@/components/common/field';
import { useUsers } from '@/features/user/hooks';
import {
  useChannelMembers,
  useMemberMutations,
  usePins,
  useNotificationSettings,
  useUpdateNotificationSettings,
} from '../hooks';
import type { ChatMessage, NotifyLevel } from '../types';
import { formatChatTime, initialOf } from './chat-utils';

// ── 멤버 관리 ──
export function MembersDialog({
  open,
  onOpenChange,
  channelId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  channelId: number;
}) {
  const { data: members = [], isPending } = useChannelMembers(open ? channelId : null);
  const { add, remove } = useMemberMutations(channelId);
  const [keyword, setKeyword] = useState('');
  const { data: userPage } = useUsers(keyword, 0, 10);
  const memberIds = new Set(members.map((m) => m.userId));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>채널 멤버</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <div className="mb-1.5 text-xs font-medium text-muted-foreground">멤버 추가</div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="이름/이메일 검색"
                className="pl-8"
              />
            </div>
            {keyword.trim() && (
              <div className="mt-1.5 max-h-40 overflow-y-auto rounded-md border border-border">
                {(userPage?.items ?? [])
                  .filter((u) => !memberIds.has(u.id))
                  .map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => add.mutate(u.id)}
                      className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm outline-none hover:bg-accent focus-visible:bg-accent"
                    >
                      <Avatar className="size-6">
                        <AvatarFallback className="text-xs">{initialOf(u.name)}</AvatarFallback>
                      </Avatar>
                      <span className="flex-1 truncate">{u.name}</span>
                      <UserPlus className="size-4 text-muted-foreground" />
                    </button>
                  ))}
              </div>
            )}
          </div>

          <div>
            <div className="mb-1.5 text-xs font-medium text-muted-foreground">
              현재 멤버 {members.length}명
            </div>
            <div className="max-h-56 space-y-1 overflow-y-auto">
              {isPending ? (
                <Skeleton className="h-8 w-full" />
              ) : (
                members.map((m) => (
                  <div key={m.userId} className="flex items-center gap-2 rounded-md px-1 py-1">
                    <Avatar className="size-7">
                      <AvatarFallback className="text-xs">{initialOf(m.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-foreground">{m.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{m.email}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      aria-label="멤버 제외"
                      onClick={() => remove.mutate(m.userId)}
                    >
                      <X className="size-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── 핀 목록 ──
export function PinsDialog({
  open,
  onOpenChange,
  channelId,
  onOpenMessage,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  channelId: number;
  onOpenMessage?: (m: ChatMessage) => void;
}) {
  const { data: pins = [], isPending } = usePins(open ? channelId : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>고정된 메시지</DialogTitle>
        </DialogHeader>
        <div className="max-h-80 space-y-2 overflow-y-auto">
          {isPending ? (
            <Skeleton className="h-12 w-full" />
          ) : pins.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">고정된 메시지가 없습니다.</p>
          ) : (
            pins.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onOpenMessage?.(m)}
                className="block w-full rounded-md border border-border p-2 text-left outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold">{m.authorName}</span>
                  <span className="text-xs text-muted-foreground">{formatChatTime(m.createdAt)}</span>
                </div>
                <div
                  className="tiptap mt-0.5 line-clamp-2 text-sm text-muted-foreground"
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{ __html: m.contentHtml }}
                />
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── 알림 설정 ──
const LEVEL_LABEL: Record<NotifyLevel, string> = {
  ALL: '모든 메시지',
  MENTIONS: '멘션만',
  NONE: '받지 않음',
};

export function NotificationSettingsDialog({
  open,
  onOpenChange,
  channelId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  channelId: number;
}) {
  const { data, isPending } = useNotificationSettings(open ? channelId : null);
  const update = useUpdateNotificationSettings(channelId);
  const [level, setLevel] = useState<NotifyLevel>('ALL');

  useEffect(() => {
    if (data) setLevel((data.notifyLevel as NotifyLevel) ?? 'ALL');
  }, [data]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>알림 설정</DialogTitle>
        </DialogHeader>
        {isPending ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <div className="space-y-4">
            <Field label="알림 수준">
              <Select value={level} onValueChange={(v) => setLevel(v as NotifyLevel)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(LEVEL_LABEL) as NotifyLevel[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {LEVEL_LABEL[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={() => update.mutate({ notifyLevel: level }, { onSuccess: () => onOpenChange(false) })}
                disabled={update.isPending}
              >
                저장
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
