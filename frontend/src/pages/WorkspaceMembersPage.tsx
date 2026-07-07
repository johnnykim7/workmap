// 워크스페이스 멤버 관리 (/workspaces/:wsId/members) — CR-018, WMP-WS-007.
// 전사 Admin만(BE @PreAuthorize). WS 멤버 = 1차 격리 경계(BIZ-112) — 여기 추가돼야 그 WS를 봄.
import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trash2, UserPlus, ArrowLeft } from 'lucide-react';
import {
  Button, Skeleton,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@therecommerce/ds-ui';
import { PageHead } from '@/components/common/page-head';
import { EmptyState } from '@/components/common/empty-state';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import {
  useWorkspaceMembers, useAddWorkspaceMember, useRemoveWorkspaceMember,
} from '@/features/workspaces/hooks';
import { useWorkspaces } from '@/features/workspaces/hooks';
import { useUsers } from '@/features/user/hooks';
import { useAuthStore } from '@/store/auth-store';
import { ROUTES } from '@/lib/route-paths';
import type { WorkspaceMember } from '@/features/workspaces/api';

export function WorkspaceMembersPage() {
  const { wsId = '' } = useParams();
  const workspaceId = Number(wsId);
  const navigate = useNavigate();

  const role = useAuthStore((s) => s.user?.role);
  const canManage = role === 'OWNER' || role === 'ADMIN';

  const { data: workspaces = [] } = useWorkspaces();
  const ws = workspaces.find((w) => w.id === workspaceId);
  const { data: members, isPending } = useWorkspaceMembers(workspaceId);
  const { data: usersPage } = useUsers('', 0, 100);
  const addMember = useAddWorkspaceMember(workspaceId);
  const removeMember = useRemoveWorkspaceMember(workspaceId);

  const [selectedUser, setSelectedUser] = useState<string>('');
  const [removing, setRemoving] = useState<WorkspaceMember | null>(null);

  // 아직 멤버가 아닌 사용자만 추가 후보로.
  const memberIds = useMemo(() => new Set((members ?? []).map((m) => m.userId)), [members]);
  const candidates = (usersPage?.items ?? []).filter((u) => !memberIds.has(u.id));

  const submitAdd = () => {
    if (!selectedUser) return;
    addMember.mutate(Number(selectedUser), { onSuccess: () => setSelectedUser('') });
  };

  if (!canManage) {
    return (
      <EmptyState
        title="권한이 없습니다"
        description="워크스페이스 멤버 관리는 전사 관리자만 가능합니다."
      />
    );
  }

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-2" onClick={() => navigate(ROUTES.projects)}>
        <ArrowLeft className="size-4" /> 프로젝트로
      </Button>
      <PageHead
        title={`멤버 관리 — ${ws?.name ?? '워크스페이스'}`}
        desc="워크스페이스 멤버만 그 안의 프로젝트·업무·검색에 접근할 수 있습니다(BIZ-112)."
      />

      {/* 멤버 추가 — 생성/추가 = primary */}
      <div className="mb-5 flex items-end gap-2">
        <div className="w-64">
          <label className="mb-1 block text-sm text-muted-foreground">사용자 추가</label>
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger className="text-left [&>span]:text-left">
              <SelectValue placeholder="사용자 선택" />
            </SelectTrigger>
            <SelectContent>
              {candidates.map((u) => (
                <SelectItem key={u.id} value={String(u.id)}>
                  {u.name} ({u.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="primary" onClick={submitAdd} disabled={!selectedUser || addMember.isPending}>
          <UserPlus className="size-4" /> 추가
        </Button>
      </div>

      {isPending ? (
        <div className="grid gap-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
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
              {/* 삭제/제거 = destructive, 항상 우측, 휴지통 아이콘(CLAUDE.md) */}
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
