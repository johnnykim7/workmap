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
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from '@therecommerce/ds-ui';
import { ChevronDown, Search, UserPlus, X } from 'lucide-react';
import { Field } from '@/components/common/field';
import { useWorkspaceMembers } from '@/features/workspaces/hooks';
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
  workspaceId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  channelId: number;
  workspaceId: number | null;
}) {
  const { data: members = [], isPending } = useChannelMembers(open ? channelId : null);
  const { add, remove } = useMemberMutations(channelId);
  // 채널 멤버 후보 = 이 워크스페이스의 멤버만(슬랙식 격리, BIZ-112). 전사 사용자 검색 금지.
  const { data: wsMembers = [] } = useWorkspaceMembers(open && workspaceId != null ? workspaceId : undefined);
  const memberIds = new Set(members.map((m) => m.userId));
  // 추가 후보 = 이 워크스페이스 멤버 중 아직 채널에 없는 사람(슬랙식 격리, BIZ-112).
  const addable = wsMembers.filter((u) => !memberIds.has(u.userId));

  // 콤보박스(드롭다운 + 검색) — 멤버 많아도 깔끔, 타이핑 필터.
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const candidates = addable.filter(
    (u) => q === '' || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>채널 멤버</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <div className="mb-1.5 text-xs font-medium text-muted-foreground">
              멤버 추가 (워크스페이스 멤버)
            </div>
            {/* 드롭다운(콤보박스) — 평소엔 닫혀있고, 열면 검색 + 워크스페이스 멤버 목록. 멤버 많아도 깔끔. */}
            <Popover open={pickerOpen} onOpenChange={(v) => { setPickerOpen(v); if (!v) setQuery(''); }}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  disabled={addable.length === 0}
                  className="flex h-8.5 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-[0.8125rem] text-muted-foreground shadow-xs shadow-black/5 transition-shadow outline-none hover:bg-background focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 data-[state=open]:bg-background"
                >
                  {addable.length === 0
                    ? (wsMembers.length === 0 ? '워크스페이스 멤버 없음' : '추가할 멤버 없음')
                    : '멤버 선택…'}
                  <ChevronDown className="size-4 shrink-0 opacity-60" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
                <div className="relative border-b border-border">
                  <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="이름/이메일 검색"
                    className="border-0 pl-8 focus-visible:ring-0"
                  />
                </div>
                <div className="max-h-52 overflow-y-auto p-1">
                  {candidates.length === 0 ? (
                    <p className="px-2 py-2 text-xs text-muted-foreground">검색 결과가 없습니다.</p>
                  ) : (
                    candidates.map((u) => (
                      <button
                        key={u.userId}
                        type="button"
                        onClick={() => {
                          add.mutate(u.userId);
                          setPickerOpen(false);
                          setQuery('');
                        }}
                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm outline-none hover:bg-accent focus-visible:bg-accent"
                      >
                        <Avatar className="size-6">
                          <AvatarFallback className="text-xs">{initialOf(u.name)}</AvatarFallback>
                        </Avatar>
                        <span className="min-w-0 flex-1 truncate">{u.name}</span>
                        <span className="truncate text-xs text-muted-foreground">{u.email}</span>
                        <UserPlus className="size-4 shrink-0 text-muted-foreground" />
                      </button>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
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
                      <AvatarFallback className="text-xs">{initialOf(m.userName)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      {/* 채널 멤버 응답엔 email이 없음(BE MemberResponse) — 이름만 표시. */}
                      <div className="truncate text-sm text-foreground">{m.userName}</div>
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
