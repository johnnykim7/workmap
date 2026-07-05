// 하위 작업(부모-자식 계층, 진행률 집계 대상) — §9.3. 연결된 업무와 별개 섹션.
// 인라인 추가(빠른 생성): 제목만 입력 → POST /work-items/{id}/subtasks. 행 클릭 시 상세 이동.
import { useEffect, useState, type MutableRefObject } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Spinner } from '@therecommerce/ds-ui';
import { Plus } from 'lucide-react';
import { ROUTES } from '@/lib/route-paths';
import { StatusBadge, TypeBadge } from '@/components/badges';
import { type WorkItemResponse } from '@/types/domain';
import { useBoard } from '@/features/board/hooks';
import { useProjectItems, useCreateSubtask, pickSubtasks } from '../hooks';
import { SubtaskCheckbox } from './SubtaskCheckbox';

interface Props {
  item: WorkItemResponse;
  // 상단 +액션 메뉴에서 인라인 추가를 열기 위한 트리거 노출.
  addRef?: MutableRefObject<() => void>;
}

export function SubtaskList({ item, addRef }: Props) {
  const navigate = useNavigate();
  const { data: items, isPending } = useProjectItems(item.projectId);
  const subtasks = pickSubtasks(items, item.id);
  const create = useCreateSubtask(item.id, item.projectId, item.key);
  // 완료 체크박스 대상 statusId 해소용 — 하위작업은 부모와 같은 프로젝트/워크플로 → 보드 컬럼 재사용.
  const { data: board } = useBoard(item.projectId);
  const columns = board?.groups?.[0]?.columns ?? [];
  const doneStatusId = columns.find((c) => c.isDone)?.statusId;
  // 되돌리기(체크 해제) 대상 = 첫 미완료(TODO) 컬럼. 없으면 되돌리기 비활성.
  const todoStatusId = columns.find((c) => !c.isDone && !c.isApproval)?.statusId;

  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');

  useEffect(() => { if (addRef) addRef.current = () => setAdding(true); }, [addRef]);

  function submit() {
    const t = title.trim();
    if (!t) return;
    create.mutate({ title: t }, {
      onSuccess: () => { setTitle(''); setAdding(false); },
    });
  }

  return (
    <section>
      <div className="mb-1.5 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">하위 작업</h2>
        <Button variant="ghost" size="sm" className="gap-1" onClick={() => setAdding((v) => !v)}>
          <Plus className="size-4" /> 추가
        </Button>
      </div>

      {isPending ? (
        <p className="text-sm text-muted-foreground">불러오는 중…</p>
      ) : subtasks.length === 0 && !adding ? (
        // 빈 섹션 압축: 안내문 줄 제거(제목+추가 버튼만) — 여러 빈 섹션이 쌓여 휑해지는 것 방지.
        null
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {subtasks.map((s) => {
            const done = s.commonStatus === 'DONE' || s.commonStatus === 'OPS_APPLIED';
            return (
              <li key={s.id} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/40">
                <SubtaskCheckbox
                  subtask={s}
                  done={done}
                  doneStatusId={doneStatusId}
                  todoStatusId={todoStatusId}
                />
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.workItem(s.key))}
                  className="flex flex-1 items-center gap-2 text-left"
                >
                  <TypeBadge type={s.issueType} withLabel={false} />
                  <span className="font-mono text-xs text-muted-foreground">{s.key}</span>
                  <span className={`flex-1 truncate ${done ? 'text-muted-foreground line-through' : ''}`}>
                    {s.title}
                  </span>
                  <StatusBadge status={s.commonStatus} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {adding && (
        <div className="mt-2 flex items-center gap-2">
          <Input
            autoFocus
            placeholder="하위 작업 제목"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') { setAdding(false); setTitle(''); } }}
          />
          <Button variant="primary" size="sm" disabled={create.isPending || !title.trim()} onClick={submit}>
            {create.isPending && <Spinner className="size-4" />} 추가
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { setAdding(false); setTitle(''); }}>취소</Button>
        </div>
      )}
    </section>
  );
}
