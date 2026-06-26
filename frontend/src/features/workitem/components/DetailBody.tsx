// 업무 상세 본문(§9.3 유형별 분기) — 설명(공통) + 유형별 섹션.
// Epic: 하위 묶음 진행률 집계 / Story: 인수조건 / Task: 체크리스트·공수 / Bug: 재현절차·기대vs실제·환경·심각도 / Sub-task: 부모 링크.
// 인라인 편집: 설명·인수조건·체크리스트·재현절차 등은 Textarea blur commit. 색 절제(중립 톤).
import { useEffect, useState } from 'react';
import { Textarea } from '@therecommerce/ds-ui';
import { ROUTES } from '@/lib/route-paths';
import { useNavigate } from 'react-router-dom';
import { type WorkItemResponse, STATUS_CATEGORY } from '@/types/domain';
import { useUpdateWorkItem, useProjectItems } from '../hooks';
import { StatusBadge, TypeBadge } from '@/components/badges';

interface Props {
  item: WorkItemResponse;
}

export function DetailBody({ item }: Props) {
  const update = useUpdateWorkItem(item.id, item.key);

  return (
    <div className="space-y-5">
      {/* 설명(공통) */}
      <Section title="설명">
        <TextBlock
          value={item.description ?? ''}
          placeholder="설명을 입력하세요."
          onCommit={(v) => update.mutate({ description: v })}
        />
      </Section>

      {item.issueType === 'EPIC' && <EpicChildren item={item} />}

      {item.issueType === 'STORY' && (
        <Section title="인수조건">
          <ListBlock
            value={item.acceptanceCriteria ?? []}
            placeholder="인수조건을 한 줄에 하나씩 입력하세요."
            onCommit={(lines) => update.mutate({ acceptanceCriteria: lines })}
          />
        </Section>
      )}

      {item.issueType === 'TASK' && (
        <>
          <Section title="작업 체크리스트">
            <TextBlock
              value={item.checklist ?? ''}
              placeholder="- [ ] 할 일 형태로 입력"
              onCommit={(v) => update.mutate({ checklist: v })}
            />
          </Section>
          <EffortRow item={item} />
        </>
      )}

      {item.issueType === 'BUG' && (
        <>
          <Section title="재현 절차">
            <ListBlock
              value={item.stepsToReproduce ?? []}
              placeholder="재현 절차를 한 줄에 하나씩 입력하세요."
              onCommit={(lines) => update.mutate({ stepsToReproduce: lines })}
            />
          </Section>
          <div className="grid gap-4 sm:grid-cols-2">
            <Section title="기대 결과">
              <TextBlock value={item.expectedResult ?? ''} placeholder="기대한 동작" onCommit={(v) => update.mutate({ expectedResult: v })} />
            </Section>
            <Section title="실제 결과">
              <TextBlock value={item.actualResult ?? ''} placeholder="실제 동작" onCommit={(v) => update.mutate({ actualResult: v })} />
            </Section>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Section title="환경">
              <TextBlock value={item.environment ?? ''} placeholder="OS/브라우저/버전 등" onCommit={(v) => update.mutate({ environment: v })} singleLine />
            </Section>
            <Section title="심각도">
              <TextBlock value={item.severity ?? ''} placeholder="예: Critical / Major / Minor" onCommit={(v) => update.mutate({ severity: v })} singleLine />
            </Section>
          </div>
        </>
      )}

      {item.issueType === 'SUBTASK' && item.parentId != null && (
        <Section title="상위 작업">
          <ParentLink parentId={item.parentId} projectId={item.projectId} />
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-1.5 text-sm font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

// 멀티라인/단일라인 텍스트 인라인 편집 — blur 시 commit.
function TextBlock({ value, placeholder, onCommit, singleLine }: {
  value: string; placeholder?: string; onCommit: (v: string) => void; singleLine?: boolean;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => { setDraft(value); }, [value]);
  function commit() { if (draft !== value) onCommit(draft); }
  return (
    <Textarea
      rows={singleLine ? 1 : 3}
      className="resize-y"
      placeholder={placeholder}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
    />
  );
}

// 줄 목록 편집(인수조건/재현절차) — 개행 분리, 빈 줄 제거 후 commit.
function ListBlock({ value, placeholder, onCommit }: {
  value: string[]; placeholder?: string; onCommit: (lines: string[]) => void;
}) {
  const [draft, setDraft] = useState(value.join('\n'));
  useEffect(() => { setDraft(value.join('\n')); }, [value]);
  function commit() {
    const lines = draft.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.join('\n') !== value.join('\n')) onCommit(lines);
  }
  return (
    <div className="space-y-1.5">
      {value.length > 0 && (
        <ul className="list-disc space-y-0.5 pl-5 text-sm text-foreground">
          {value.map((l, i) => <li key={i}>{l}</li>)}
        </ul>
      )}
      <Textarea rows={3} placeholder={placeholder} value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={commit} />
    </div>
  );
}

function EffortRow({ item }: { item: WorkItemResponse }) {
  return (
    <Section title="공수">
      <div className="flex gap-6 text-sm">
        <div>
          <span className="text-muted-foreground">예상</span>{' '}
          <span className="font-medium">{item.estimateHours != null ? `${item.estimateHours}h` : '–'}</span>
        </div>
        <div>
          <span className="text-muted-foreground">진행률</span>{' '}
          <span className="font-medium">{item.progress}%</span>
        </div>
      </div>
    </Section>
  );
}

// Epic 하위 묶음 + 진행률 집계(상태 카테고리 DONE 비율).
function EpicChildren({ item }: { item: WorkItemResponse }) {
  const navigate = useNavigate();
  const { data: items = [], isPending } = useProjectItems(item.projectId);
  const children = items.filter((w) => w.epicId === item.id && w.id !== item.id);
  const done = children.filter((w) => STATUS_CATEGORY[w.commonStatus] === 'DONE').length;
  const pct = children.length ? Math.round((done / children.length) * 100) : 0;

  return (
    <Section title="하위 항목">
      {isPending ? (
        <p className="text-sm text-muted-foreground">불러오는 중…</p>
      ) : children.length === 0 ? (
        <p className="text-sm text-muted-foreground">이 Epic에 속한 항목이 없습니다.</p>
      ) : (
        <>
          <div className="mb-2 flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-muted-foreground">{done}/{children.length} ({pct}%)</span>
          </div>
          <ul className="divide-y divide-border rounded-md border border-border">
            {children.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.workItem(c.key))}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/40"
                >
                  <TypeBadge type={c.issueType} withLabel={false} />
                  <span className="font-mono text-xs text-muted-foreground">{c.key}</span>
                  <span className="flex-1 truncate">{c.title}</span>
                  <StatusBadge status={c.commonStatus} />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </Section>
  );
}

function ParentLink({ parentId, projectId }: { parentId: number; projectId: number }) {
  const navigate = useNavigate();
  const { data: items = [] } = useProjectItems(projectId);
  const parent = items.find((w) => w.id === parentId);
  if (!parent) return <p className="text-sm text-muted-foreground">상위 작업 #{parentId}</p>;
  return (
    <button
      type="button"
      onClick={() => navigate(ROUTES.workItem(parent.key))}
      className="flex w-full items-center gap-2 rounded-md border border-border px-3 py-2 text-left text-sm hover:bg-muted/40"
    >
      <TypeBadge type={parent.issueType} withLabel={false} />
      <span className="font-mono text-xs text-muted-foreground">{parent.key}</span>
      <span className="flex-1 truncate">{parent.title}</span>
      <StatusBadge status={parent.commonStatus} />
    </button>
  );
}
