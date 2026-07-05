// 멤버 초대 다이얼로그 — 사용자 검색 선택 + 프로젝트 역할 지정 → POST /projects/:key/members.
import { useState } from 'react';
import type React from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Button, Spinner, SearchInput,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@therecommerce/ds-ui';
import { UserAvatar } from '@/components/common/user-avatar';
import { Field } from '@/components/common/field';
import { useInviteMember, useUserSearch } from '../hooks';
import type { User, UserRole } from '@/types/domain';

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'MANAGER', label: '매니저' },
  { value: 'MEMBER', label: '멤버' },
  { value: 'VIEWER', label: '뷰어' },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: number;
  excludeUserIds: number[];
}

export function InviteMemberDialog({ open, onOpenChange, projectId, excludeUserIds }: Props) {
  const [keyword, setKeyword] = useState('');
  const [picked, setPicked] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('MEMBER');
  const invite = useInviteMember(projectId);

  const { data: candidates = [], isFetching } = useUserSearch(keyword);
  const excluded = new Set(excludeUserIds);
  const available = candidates.filter((u) => !excluded.has(u.id));

  function close() {
    if (invite.isPending) return;
    onOpenChange(false);
    setTimeout(() => { setKeyword(''); setPicked(null); setRole('MEMBER'); }, 200);
  }

  function submit() {
    if (!picked) return;
    invite.mutate({ userId: picked.id, role }, { onSuccess: () => close() });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>멤버 초대</DialogTitle>
          <DialogDescription>프로젝트에 참여할 사용자를 검색해 역할을 지정합니다.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {picked ? (
            <div className="flex items-center gap-2 rounded-md border border-border p-2.5">
              <UserAvatar name={picked.name} avatarUrl={picked.avatarUrl} size="md" noCard />
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">{picked.name}</div>
                <div className="text-xs text-muted-foreground">{picked.email}</div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setPicked(null)}>변경</Button>
            </div>
          ) : (
            <>
              <SearchInput placeholder="이름·이메일로 검색" value={keyword} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setKeyword(e.target.value)} />
              <div className="max-h-40 overflow-y-auto rounded-md border border-border">
                {isFetching && available.length === 0 ? (
                  <div className="p-3 text-center text-xs text-muted-foreground">검색 중…</div>
                ) : available.length === 0 ? (
                  <div className="p-3 text-center text-xs text-muted-foreground">초대 가능한 사용자가 없습니다</div>
                ) : (
                  available.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setPicked(u)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/50"
                    >
                      <UserAvatar name={u.name} avatarUrl={u.avatarUrl} size="sm" noCard />
                      <span className="font-medium text-foreground">{u.name}</span>
                      <span className="text-xs text-muted-foreground">{u.email}</span>
                    </button>
                  ))
                )}
              </div>
            </>
          )}

          <Field label="프로젝트 역할" htmlFor="m-role">
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger id="m-role"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={close} disabled={invite.isPending}>취소</Button>
          <Button variant="primary" onClick={submit} disabled={!picked || invite.isPending}>
            {invite.isPending && <Spinner className="size-4" />}
            초대
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
