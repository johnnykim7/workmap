// 인라인 생성 행(§6.1, Jira식) — 백로그/스프린트 구역 하단 "+ 만들기".
// 클릭하면 제목 입력칸이 펼쳐지고 Enter로 생성, Esc/빈 입력 blur로 접힘. 모달 없이 그 자리서 추가.
// 실제 생성(POST /work-items)은 호출부(BacklogView)가 onCreate로 처리 — 구역별 sprintId 프리필 책임은 호출부.
import { useState, useRef, useEffect } from 'react';
import { Button, Input } from '@therecommerce/ds-ui';
import { Plus } from 'lucide-react';

interface Props {
  onCreate: (title: string) => void;
  busy?: boolean;
}

export function InlineCreateRow({ onCreate, busy }: Props) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const submit = () => {
    const t = title.trim();
    if (!t || busy) return;
    onCreate(t);
    setTitle(''); // 연속 생성을 위해 입력만 비우고 편집 상태 유지(Jira식)
    inputRef.current?.focus();
  };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="flex w-full items-center gap-1.5 border-t border-border px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted/40 hover:text-foreground"
      >
        <Plus className="size-4" />
        만들기
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 border-t border-border bg-card px-3 py-1.5">
      <Plus className="size-4 shrink-0 text-muted-foreground" />
      <Input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); submit(); }
          if (e.key === 'Escape') { setEditing(false); setTitle(''); }
        }}
        onBlur={() => { if (!title.trim()) setEditing(false); }}
        placeholder="제목을 입력하고 Enter (Esc로 취소)"
        className="h-8 flex-1"
        disabled={busy}
      />
      <Button variant="primary" size="sm" onClick={submit} disabled={busy || !title.trim()}>
        추가
      </Button>
    </div>
  );
}
