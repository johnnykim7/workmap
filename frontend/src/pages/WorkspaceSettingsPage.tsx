// 워크스페이스 설정 (/workspaces/:wsId/settings) — CR-046, WMP-WS-010.
// 비워진 LNB "설정" 자리 = WS 자신의 설정. 탭: 일반 / 멤버 / 채널 / 보관.
// 전사 OWNER/ADMIN만(POL-014, BE @PreAuthorize). 전역 시스템 설정(/admin/*)은 계정 메뉴로 분리(CR-046).
import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Button, Input, Textarea, Skeleton, cn,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@therecommerce/ds-ui';
import {
  Settings2, Users, MessageSquare, Archive, Trash2, UserPlus, Plus, Pencil,
} from 'lucide-react';
import { PageHead } from '@/components/common/page-head';
import { Field } from '@/components/common/field';
import { EmptyState } from '@/components/common/empty-state';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import {
  useWorkspaces, useUpdateWorkspace,
  useWorkspaceMembers, useAddWorkspaceMember, useRemoveWorkspaceMember,
  useArchiveWorkspace,
} from '@/features/workspaces/hooks';
import { useUsers } from '@/features/user/hooks';
import { useChannels, useChannelMutations } from '@/features/chat/hooks';
import { useCanAdmin } from '@/lib/permissions';
import { ROUTES } from '@/lib/route-paths';
import type { WorkspaceMember } from '@/features/workspaces/api';
import type { ChatChannel } from '@/features/chat/types';

type Tab = 'general' | 'members' | 'channels' | 'archive';
const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'general', label: '일반', icon: <Settings2 className="size-4" /> },
  { key: 'members', label: '멤버', icon: <Users className="size-4" /> },
  { key: 'channels', label: '채널', icon: <MessageSquare className="size-4" /> },
  { key: 'archive', label: '보관', icon: <Archive className="size-4" /> },
];

export function WorkspaceSettingsPage() {
  const { wsId = '' } = useParams();
  const workspaceId = Number(wsId);
  const navigate = useNavigate();
  const canAdmin = useCanAdmin();

  // 탭 상태는 URL(?tab=)로 — 새로고침·뒤로가기 보존. 스위처/멤버 링크가 기본 members로 진입 가능.
  const [sp, setSp] = useSearchParams();
  const tab = (sp.get('tab') as Tab) || 'general';
  const setTab = (t: Tab) => setSp({ tab: t }, { replace: true });

  const { data: workspaces = [], isPending } = useWorkspaces();
  const ws = workspaces.find((w) => w.id === workspaceId);

  if (!canAdmin) {
    return (
      <EmptyState
        title="권한이 없습니다"
        description="워크스페이스 설정은 전사 관리자만 가능합니다."
      />
    );
  }

  return (
    <div>
      <PageHead
        title={`워크스페이스 설정${ws ? ` — ${ws.name}` : ''}`}
        desc="이 워크스페이스의 일반 정보·멤버·채널·보관을 관리합니다. (전역 시스템 설정은 계정 메뉴 › 시스템 관리)"
      />

      {/* 탭 바 (본문 상단 가로 탭) */}
      <div className="mb-5 flex items-center gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              'flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              tab === t.key
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {isPending ? (
        <Skeleton className="h-40 w-full" />
      ) : !ws ? (
        <EmptyState title="워크스페이스를 찾을 수 없습니다" description="목록에서 다시 선택하세요." />
      ) : tab === 'general' ? (
        <GeneralTab workspaceId={workspaceId} name={ws.name} description={ws.description ?? ''} />
      ) : tab === 'members' ? (
        <MembersTab workspaceId={workspaceId} />
      ) : tab === 'channels' ? (
        <ChannelsTab workspaceId={workspaceId} />
      ) : (
        <ArchiveTab workspaceId={workspaceId} name={ws.name} onDone={() => navigate(ROUTES.projects)} />
      )}
    </div>
  );
}

// ── 일반 탭 — 이름·설명 수정 (PATCH /workspaces/{id}) ──
function GeneralTab({ workspaceId, name, description }: { workspaceId: number; name: string; description: string }) {
  const update = useUpdateWorkspace();
  const [form, setForm] = useState({ name, description });
  useEffect(() => { setForm({ name, description }); }, [name, description]);

  const dirty = form.name.trim() !== name || (form.description ?? '') !== (description ?? '');
  const save = () => {
    if (!form.name.trim()) return;
    update.mutate({ id: workspaceId, body: { name: form.name.trim(), description: form.description.trim() || undefined } });
  };

  return (
    <div className="max-w-lg space-y-4">
      <Field label="이름" required>
        <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} maxLength={150} />
      </Field>
      <Field label="설명">
        <Textarea rows={3} value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} maxLength={2000} />
      </Field>
      <Button variant="primary" onClick={save} disabled={!dirty || !form.name.trim() || update.isPending}>
        저장
      </Button>
    </div>
  );
}

// ── 멤버 탭 — 기존 WorkspaceMembersPage 본문 이관(추가/제거) ──
function MembersTab({ workspaceId }: { workspaceId: number }) {
  const { data: members, isPending } = useWorkspaceMembers(workspaceId);
  const { data: usersPage } = useUsers('', 0, 100);
  const addMember = useAddWorkspaceMember(workspaceId);
  const removeMember = useRemoveWorkspaceMember(workspaceId);

  const [selectedUser, setSelectedUser] = useState('');
  const [removing, setRemoving] = useState<WorkspaceMember | null>(null);

  const memberIds = useMemo(() => new Set((members ?? []).map((m) => m.userId)), [members]);
  const candidates = (usersPage?.items ?? []).filter((u) => !memberIds.has(u.id));

  const submitAdd = () => {
    if (!selectedUser) return;
    addMember.mutate(Number(selectedUser), { onSuccess: () => setSelectedUser('') });
  };

  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">
        워크스페이스 멤버만 그 안의 프로젝트·업무·검색에 접근할 수 있습니다(BIZ-112).
      </p>

      <div className="mb-5 flex items-end gap-2">
        <div className="w-64">
          <label className="mb-1 block text-sm text-muted-foreground">사용자 추가</label>
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger><SelectValue placeholder="사용자 선택" /></SelectTrigger>
            <SelectContent>
              {candidates.map((u) => (
                <SelectItem key={u.id} value={String(u.id)}>{u.name} ({u.email})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="primary" onClick={submitAdd} disabled={!selectedUser || addMember.isPending}>
          <UserPlus className="size-4" /> 추가
        </Button>
      </div>

      {isPending ? (
        <div className="grid gap-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
      ) : !members || members.length === 0 ? (
        <EmptyState title="멤버가 없습니다" description="위에서 사용자를 추가하세요." />
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {members.map((m) => (
            <div key={m.userId} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <div className="truncate font-medium text-foreground">{m.name}</div>
                <div className="truncate text-sm text-muted-foreground">{m.email}</div>
              </div>
              <Button variant="destructive" size="sm" onClick={() => setRemoving(m)}>
                <Trash2 className="size-4" /> 제거
              </Button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        title="멤버를 제거하시겠습니까?"
        description={`${removing?.name}님을 이 워크스페이스에서 제거합니다. 제거되면 이 워크스페이스의 프로젝트·업무에 접근할 수 없습니다.`}
        confirmLabel="제거"
        destructive
        onConfirm={() => {
          if (removing) removeMember.mutate(removing.userId, { onSuccess: () => setRemoving(null) });
        }}
      />
    </div>
  );
}

// ── 채널 탭 — WS 채팅 채널 CRUD (관리자만, POL-014) ──
function ChannelsTab({ workspaceId }: { workspaceId: number }) {
  const { data: channels, isPending } = useChannels(workspaceId);
  const { create, update, remove } = useChannelMutations(workspaceId);

  const [editing, setEditing] = useState<ChatChannel | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ displayName: '', description: '' });
  const [deleting, setDeleting] = useState<ChatChannel | null>(null);

  const openCreate = () => { setEditing(null); setCreating(true); setForm({ displayName: '', description: '' }); };
  const openEdit = (c: ChatChannel) => {
    setCreating(false); setEditing(c);
    setForm({ displayName: c.displayName, description: c.description ?? '' });
  };
  const close = () => { setCreating(false); setEditing(null); };

  const submit = () => {
    const displayName = form.displayName.trim();
    if (!displayName) return;
    if (editing) {
      update.mutate({ id: editing.id, body: { displayName, description: form.description.trim() || null } },
        { onSuccess: close });
    } else {
      // name(슬러그)은 displayName 기반 간이 생성 — 서버가 유일성 보장 필요 시 조정.
      const name = displayName.toLowerCase().replace(/\s+/g, '-').slice(0, 50) || 'channel';
      create.mutate({ workspaceId, name, displayName, description: form.description.trim() || null },
        { onSuccess: close });
    }
  };

  const showForm = creating || editing;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">이 워크스페이스의 채팅 채널을 관리합니다.</p>
        <Button variant="primary" size="sm" onClick={openCreate}>
          <Plus className="size-4" /> 채널 추가
        </Button>
      </div>

      {showForm && (
        <div className="mb-4 space-y-3 rounded-lg border border-border p-4">
          <Field label="채널 이름" required>
            <Input value={form.displayName} autoFocus
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))} maxLength={100} />
          </Field>
          <Field label="설명">
            <Input value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} maxLength={500} />
          </Field>
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={submit}
              disabled={!form.displayName.trim() || create.isPending || update.isPending}>
              {editing ? '수정' : '만들기'}
            </Button>
            <Button variant="ghost" size="sm" onClick={close}>취소</Button>
          </div>
        </div>
      )}

      {isPending ? (
        <div className="grid gap-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
      ) : !channels || channels.length === 0 ? (
        <EmptyState title="채널이 없습니다" description="[채널 추가]로 첫 채널을 만들어 보세요." />
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {channels.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <div className="truncate font-medium text-foreground"># {c.displayName}</div>
                {c.description && <div className="truncate text-sm text-muted-foreground">{c.description}</div>}
              </div>
              <div className="flex shrink-0 gap-1">
                <Button variant="secondary" size="sm" onClick={() => openEdit(c)}>
                  <Pencil className="size-3.5" /> 수정
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setDeleting(c)}>
                  <Trash2 className="size-3.5" /> 삭제
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="채널을 삭제하시겠습니까?"
        description={`'${deleting?.displayName}' 채널을 삭제합니다. 채널의 메시지도 함께 사라집니다.`}
        confirmLabel="삭제"
        destructive
        onConfirm={() => {
          if (deleting) remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) });
        }}
      />
    </div>
  );
}

// ── 보관 탭 — WS 보관/해제 (WMP-WS-011, 소프트 동결) ──
function ArchiveTab({ workspaceId, name, onDone }: { workspaceId: number; name: string; onDone: () => void }) {
  const archive = useArchiveWorkspace();
  const [confirming, setConfirming] = useState(false);

  // 목록엔 ACTIVE만 오므로, 이 화면에 보이는 WS는 사실상 ACTIVE. 해제 버튼은 방어적으로 노출 안 함.
  return (
    <div className="max-w-lg space-y-4">
      <div className="rounded-lg border border-border p-4">
        <div className="mb-1 font-medium text-foreground">워크스페이스 보관</div>
        <p className="text-sm text-muted-foreground">
          보관하면 이 워크스페이스가 목록·스위처에서 숨겨집니다. 하위 프로젝트·업무·채널·멤버는
          그대로 보존되며(삭제 아님), 언제든 해제할 수 있습니다.
        </p>
        <Button variant="destructive" className="mt-3" onClick={() => setConfirming(true)} disabled={archive.isPending}>
          <Archive className="size-4" /> 이 워크스페이스 보관
        </Button>
      </div>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="워크스페이스를 보관하시겠습니까?"
        description={`'${name}'를 보관하면 목록·스위처에서 숨겨집니다. 하위 데이터는 보존되며 언제든 해제할 수 있습니다.`}
        confirmLabel="보관"
        destructive
        onConfirm={() => archive.mutate(workspaceId, { onSuccess: () => { setConfirming(false); onDone(); } })}
      />
    </div>
  );
}
