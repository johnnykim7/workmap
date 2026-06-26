// 멤버 선택기 — 사용자 검색(GET /users) + 다중 선택 칩. 마법사 4단계에서 사용.
// 멤버만 담당자/멘션 대상(BIZ-108) 원칙의 입력부.
import { useState } from 'react';
import type React from 'react';
import { Search, X } from 'lucide-react';
import { SearchInput, Avatar, AvatarFallback } from '@therecommerce/ds-ui';
import { useUserSearch } from '../hooks';
import type { User } from '@/types/domain';

interface Props {
  selected: User[];
  onChange: (next: User[]) => void;
}

export function MemberPicker({ selected, onChange }: Props) {
  const [keyword, setKeyword] = useState('');
  const { data: candidates = [], isFetching } = useUserSearch(keyword);

  const selectedIds = new Set(selected.map((u) => u.id));
  const available = candidates.filter((u) => !selectedIds.has(u.id));

  const add = (u: User) => onChange([...selected, u]);
  const remove = (id: number) => onChange(selected.filter((u) => u.id !== id));

  return (
    <div className="flex flex-col gap-2">
      {/* 선택된 멤버 칩 */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((u) => (
            <span key={u.id} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs">
              {u.name}
              <button type="button" onClick={() => remove(u.id)} className="text-muted-foreground hover:text-foreground" aria-label={`${u.name} 제거`}>
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <SearchInput
        placeholder="이름·이메일로 검색"
        value={keyword}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setKeyword(e.target.value)}
      />

      {/* 후보 목록 */}
      <div className="max-h-44 overflow-y-auto rounded-md border border-border">
        {isFetching && available.length === 0 ? (
          <div className="p-3 text-center text-xs text-muted-foreground">검색 중…</div>
        ) : available.length === 0 ? (
          <div className="flex items-center justify-center gap-1.5 p-3 text-xs text-muted-foreground">
            <Search className="size-3.5" /> 추가할 사용자가 없습니다
          </div>
        ) : (
          available.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => add(u)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50"
            >
              <Avatar className="size-6"><AvatarFallback className="text-[10px]">{u.name[0]}</AvatarFallback></Avatar>
              <span className="font-medium text-foreground">{u.name}</span>
              <span className="text-xs text-muted-foreground">{u.email}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
