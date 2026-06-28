// 좌측 채널 목록 — 시스템/일반 구분, unread 배지, + 채널 생성(ds-ui Dialog).
import { useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  Textarea,
  Skeleton,
  cn,
} from '@therecommerce/ds-ui';
import { Hash, Lock, Plus } from 'lucide-react';
import { Field } from '@/components/common/field';
import type { ChatChannel } from '../types';
import { useChannelMutations } from '../hooks';

interface Props {
  workspaceId: number | null;
  channels: ChatChannel[];
  loading: boolean;
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export function ChannelSidebar({ workspaceId, channels, loading, selectedId, onSelect }: Props) {
  const [createOpen, setCreateOpen] = useState(false);

  const { system, general } = useMemo(() => {
    const system = channels.filter((c) => c.kind === 'SYSTEM');
    const general = channels.filter((c) => c.kind !== 'SYSTEM');
    return { system, general };
  }, [channels]);

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-border bg-muted/20">
      <div className="flex items-center justify-between px-3 py-2.5">
        <h2 className="text-sm font-semibold text-foreground">채널</h2>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          aria-label="채널 만들기"
          disabled={workspaceId == null}
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="size-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-1.5 pb-3">
        {loading ? (
          <div className="space-y-1.5 px-1.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-full" />
            ))}
          </div>
        ) : (
          <>
            {system.length > 0 && (
              <ChannelGroup
                label="시스템"
                channels={system}
                selectedId={selectedId}
                onSelect={onSelect}
              />
            )}
            <ChannelGroup
              label="채널"
              channels={general}
              selectedId={selectedId}
              onSelect={onSelect}
              emptyText="채널이 없습니다."
            />
          </>
        )}
      </div>

      <CreateChannelDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        workspaceId={workspaceId}
        onCreated={onSelect}
      />
    </aside>
  );
}

function ChannelGroup({
  label,
  channels,
  selectedId,
  onSelect,
  emptyText,
}: {
  label: string;
  channels: ChatChannel[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  emptyText?: string;
}) {
  return (
    <div className="mb-2">
      <div className="px-2 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      {channels.length === 0 && emptyText ? (
        <p className="px-2 py-1 text-xs text-muted-foreground">{emptyText}</p>
      ) : (
        channels.map((c) => {
          const active = c.id === selectedId;
          const Icon = c.kind === 'SYSTEM' ? Lock : Hash;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c.id)}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active ? 'bg-primary/10 font-medium text-primary' : 'text-foreground hover:bg-accent',
              )}
            >
              <Icon className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate">{c.displayName}</span>
              {c.unreadCount > 0 && (
                <Badge variant="secondary" className="h-5 min-w-5 justify-center px-1 text-xs">
                  {c.unreadCount > 99 ? '99+' : c.unreadCount}
                </Badge>
              )}
            </button>
          );
        })
      )}
    </div>
  );
}

function CreateChannelDialog({
  open,
  onOpenChange,
  workspaceId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  workspaceId: number | null;
  onCreated: (id: number) => void;
}) {
  const [displayName, setDisplayName] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { create } = useChannelMutations(workspaceId);

  const reset = () => {
    setDisplayName('');
    setName('');
    setDescription('');
  };

  const submit = () => {
    if (workspaceId == null || !displayName.trim()) return;
    const slug =
      name.trim() ||
      displayName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    create.mutate(
      {
        workspaceId,
        name: slug || displayName.trim(),
        displayName: displayName.trim(),
        description: description.trim() || null,
      },
      {
        onSuccess: (ch) => {
          onOpenChange(false);
          reset();
          onCreated(ch.id);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>채널 만들기</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <Field label="채널 이름" required htmlFor="ch-display">
            <Input
              id="ch-display"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="예: 공지사항"
            />
          </Field>
          <Field label="식별자(slug)" htmlFor="ch-slug">
            <Input
              id="ch-slug"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="비우면 이름에서 자동 생성"
            />
          </Field>
          <Field label="설명" htmlFor="ch-desc">
            <Textarea
              id="ch-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="채널 용도를 간단히"
              rows={2}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={create.isPending}>
            취소
          </Button>
          <Button
            variant="primary"
            onClick={submit}
            disabled={!displayName.trim() || workspaceId == null || create.isPending}
          >
            만들기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
