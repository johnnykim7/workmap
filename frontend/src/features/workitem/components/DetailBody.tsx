// 업무 상세 본문(§9.3 유형별 분기) — 설명(공통) + 유형별 섹션.
// Epic: 하위 묶음 진행률 집계 / Story: 인수조건 / Task: 체크리스트·공수 / Bug: 재현절차·기대vs실제·환경·심각도 / Sub-task: 부모 링크.
// 편집 UX(Jira 정합): 설명·인수조건·체크리스트·재현절차 등은 평소 읽기 렌더 → [편집] 클릭 시에만 입력기 노출 → 저장/취소.
import { useEffect, useState } from 'react';
import { Button, Textarea, Checkbox } from '@therecommerce/ds-ui';
import { Pencil, Plus, X } from 'lucide-react';
import { ROUTES } from '@/lib/route-paths';
import { useNavigate } from 'react-router-dom';
import { type WorkItemResponse, type AcceptanceCriterion, STATUS_CATEGORY } from '@/types/domain';
import { useUpdateWorkItem, useProjectItems, useSaveAcceptanceCriteria } from '../hooks';
import { StatusBadge, TypeBadge } from '@/components/badges';
import { RichTextEditor } from '@/components/common/rich-text-editor';
import { htmlToPlainText } from '@/lib/html-text';
import { useCanWrite } from '@/lib/permissions';
import { metProgress } from '../acceptance-criteria';

interface Props {
  item: WorkItemResponse;
}

export function DetailBody({ item }: Props) {
  const update = useUpdateWorkItem(item.id, item.key);

  return (
    <div className="space-y-5">
      {/* 설명(공통) — CR-024 리치 에디터(HTML 저장). 읽기→[편집]→저장/취소(Jira 정합). */}
      <Section title="설명">
        <RichEditBlock
          value={item.description ?? ''}
          placeholder="설명을 입력하세요."
          onCommit={(html) => update.mutate({ description: html })}
        />
      </Section>

      {item.issueType === 'EPIC' && <EpicChildren item={item} />}

      {item.issueType === 'STORY' && (
        <AcceptanceCriteriaSection item={item} />
      )}

      {item.issueType === 'TASK' && (
        <>
          <Section title="작업 체크리스트">
            <TextEditBlock
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
            <ListEditBlock
              value={item.stepsToReproduce ?? []}
              placeholder="재현 절차를 한 줄에 하나씩 입력하세요."
              onCommit={(lines) => update.mutate({ stepsToReproduce: lines })}
            />
          </Section>
          <div className="grid gap-4 sm:grid-cols-2">
            <Section title="기대 결과">
              <TextEditBlock value={item.expectedResult ?? ''} placeholder="기대한 동작" onCommit={(v) => update.mutate({ expectedResult: v })} />
            </Section>
            <Section title="실제 결과">
              <TextEditBlock value={item.actualResult ?? ''} placeholder="실제 동작" onCommit={(v) => update.mutate({ actualResult: v })} />
            </Section>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Section title="환경">
              <TextEditBlock value={item.environment ?? ''} placeholder="OS/브라우저/버전 등" onCommit={(v) => update.mutate({ environment: v })} singleLine />
            </Section>
            <Section title="심각도">
              <TextEditBlock value={item.severity ?? ''} placeholder="예: Critical / Major / Minor" onCommit={(v) => update.mutate({ severity: v })} singleLine />
            </Section>
          </div>
        </>
      )}

    </div>
  );
}

// 상세 섹션 제목 공통 톤 — 또렷한 제목(진한 굵은 글씨)으로 위계를 준다.
// 섹션 경계는 제목 톤이 아니라 섹션 '아래' 구분선(WorkItemDetailPanel)이 담당한다.
// 다른 상세 컴포넌트(SubtaskList/LinkedItems/ActivityTabs/첨부/결과)도 이 클래스를 공유해 정합.
export const SECTION_LABEL_CLS = 'text-sm font-semibold text-foreground';

function Section({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className={SECTION_LABEL_CLS}>{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

// 인수조건(CR-049, WMP-WI-018) — 체크 가능 리스트 + 진척률(N/M 충족).
// 읽기: 체크박스(WRITER만 토글, VIEWER는 disabled) + 진척률. 편집: 항목 추가/삭제/텍스트 수정.
function AcceptanceCriteriaSection({ item }: { item: WorkItemResponse }) {
  const canWrite = useCanWrite();
  const save = useSaveAcceptanceCriteria(item.id, item.key);
  const criteria: AcceptanceCriterion[] = item.acceptanceCriteria ?? [];
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string[]>(criteria.map((c) => c.text));

  useEffect(() => {
    if (!editing) setDraft(criteria.map((c) => c.text));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.acceptanceCriteria, editing]);

  const { met, total } = metProgress(criteria);

  // 체크 토글: 해당 항목만 checked 변경 후 전체 배열 치환 저장.
  function toggle(idx: number, checked: boolean) {
    const next = criteria.map((c, i) => ({ text: c.text, checked: i === idx ? checked : c.checked }));
    save.mutate(next);
  }

  // 편집 저장: 빈 줄 제거 + 기존 체크 상태 보존(같은 text) — 서버 wrapCriteria가 최종 판단하나 UI도 정합 유지.
  function saveEdit() {
    const texts = draft.map((t) => t.trim()).filter(Boolean);
    const next = texts.map((text) => ({
      text,
      checked: criteria.find((c) => c.text === text)?.checked ?? false,
    }));
    save.mutate(next, { onSuccess: () => setEditing(false) });
  }

  const right = canWrite && !editing && (
    <button
      type="button"
      onClick={() => { setDraft(criteria.map((c) => c.text)); setEditing(true); }}
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground"
    >
      <Pencil className="h-3 w-3" /> 편집
    </button>
  );

  return (
    <Section
      title={total > 0 ? `인수조건 · ${met}/${total} 충족` : '인수조건'}
      right={right}
    >
      {editing ? (
        <div className="space-y-2">
          {draft.map((text, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-sm"
                value={text}
                autoFocus={i === draft.length - 1}
                placeholder="인수조건 항목"
                onChange={(e) => setDraft((d) => d.map((v, j) => (j === i ? e.target.value : v)))}
              />
              <button
                type="button"
                onClick={() => setDraft((d) => d.filter((_, j) => j !== i))}
                className="text-muted-foreground hover:text-destructive"
                title="항목 삭제"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setDraft((d) => [...d, ''])}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-3 w-3" /> 항목 추가
          </button>
          <EditActions onSave={saveEdit} onCancel={() => setEditing(false)} saving={save.isPending} />
        </div>
      ) : total === 0 ? (
        <p className="text-sm text-muted-foreground">
          {canWrite ? '아직 인수조건이 없습니다. [편집]으로 추가하세요.' : '인수조건이 없습니다.'}
        </p>
      ) : (
        <ul className="space-y-1.5">
          {criteria.map((c, i) => (
            <li key={i} className="flex items-start gap-2">
              <Checkbox
                checked={c.checked}
                disabled={!canWrite || save.isPending}
                onCheckedChange={(v) => toggle(i, v === true)}
                className="mt-0.5"
              />
              <span className={`text-sm ${c.checked ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                {c.text}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

// 읽기 상태에서 클릭 유도용 공통 래퍼 — 비어있으면 placeholder, 있으면 children, 우측 [편집] 버튼.
function ReadShell({ empty, placeholder, onEdit, children }: {
  empty: boolean; placeholder?: string; onEdit: () => void; children: React.ReactNode;
}) {
  return (
    <div className="group relative rounded-md border border-transparent px-2 py-1.5 -mx-2 hover:border-border hover:bg-muted/30">
      <button
        type="button"
        onClick={onEdit}
        className="absolute right-1.5 top-1.5 hidden items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground group-hover:inline-flex hover:text-foreground"
        title="편집"
      >
        <Pencil className="h-3 w-3" /> 편집
      </button>
      {empty ? (
        <button type="button" onClick={onEdit} className="text-sm text-muted-foreground hover:text-foreground">
          {placeholder ?? '입력하세요.'}
        </button>
      ) : (
        <div onClick={onEdit} className="cursor-text">{children}</div>
      )}
    </div>
  );
}

// 편집 액션 바(저장/취소) 공통.
function EditActions({ onSave, onCancel, saving }: { onSave: () => void; onCancel: () => void; saving?: boolean }) {
  return (
    <div className="mt-2 flex gap-2">
      <Button variant="primary" size="sm" onClick={onSave} disabled={saving}>저장</Button>
      <Button variant="ghost" size="sm" onClick={onCancel}>취소</Button>
    </div>
  );
}

// 리치 텍스트(설명) — 읽기 HTML 렌더 → [편집] → 에디터 + 저장/취소.
function RichEditBlock({ value, placeholder, onCommit }: {
  value: string; placeholder?: string; onCommit: (html: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => { if (!editing) setDraft(value); }, [value, editing]);

  if (!editing) {
    const empty = htmlToPlainText(value).trim().length === 0;
    return (
      <ReadShell empty={empty} placeholder={placeholder} onEdit={() => { setDraft(value); setEditing(true); }}>
        <RichTextEditor value={value} editable={false} />
      </ReadShell>
    );
  }
  return (
    <div>
      <RichTextEditor value={draft} placeholder={placeholder} onChange={setDraft} />
      <EditActions
        onSave={() => { if (draft !== value) onCommit(draft); setEditing(false); }}
        onCancel={() => { setDraft(value); setEditing(false); }}
      />
    </div>
  );
}

// 멀티라인/단일라인 텍스트 — 읽기 → [편집] → Textarea + 저장/취소.
function TextEditBlock({ value, placeholder, onCommit, singleLine }: {
  value: string; placeholder?: string; onCommit: (v: string) => void; singleLine?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => { if (!editing) setDraft(value); }, [value, editing]);

  if (!editing) {
    return (
      <ReadShell empty={value.trim().length === 0} placeholder={placeholder} onEdit={() => { setDraft(value); setEditing(true); }}>
        <p className="whitespace-pre-wrap text-sm text-foreground">{value}</p>
      </ReadShell>
    );
  }
  return (
    <div>
      <Textarea
        rows={singleLine ? 1 : 3}
        className="resize-y"
        placeholder={placeholder}
        value={draft}
        autoFocus
        onChange={(e) => setDraft(e.target.value)}
      />
      <EditActions
        onSave={() => { if (draft !== value) onCommit(draft); setEditing(false); }}
        onCancel={() => { setDraft(value); setEditing(false); }}
      />
    </div>
  );
}

// 줄 목록(인수조건/재현절차) — 읽기 불릿 → [편집] → Textarea + 저장/취소.
function ListEditBlock({ value, placeholder, onCommit }: {
  value: string[]; placeholder?: string; onCommit: (lines: string[]) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value.join('\n'));
  useEffect(() => { if (!editing) setDraft(value.join('\n')); }, [value, editing]);

  if (!editing) {
    return (
      <ReadShell empty={value.length === 0} placeholder={placeholder} onEdit={() => { setDraft(value.join('\n')); setEditing(true); }}>
        <ul className="list-disc space-y-0.5 pl-5 text-sm text-foreground">
          {value.map((l, i) => <li key={i}>{l}</li>)}
        </ul>
      </ReadShell>
    );
  }
  function save() {
    const lines = draft.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.join('\n') !== value.join('\n')) onCommit(lines);
    setEditing(false);
  }
  return (
    <div>
      <Textarea rows={4} placeholder={placeholder} value={draft} autoFocus onChange={(e) => setDraft(e.target.value)} />
      <EditActions onSave={save} onCancel={() => { setDraft(value.join('\n')); setEditing(false); }} />
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

