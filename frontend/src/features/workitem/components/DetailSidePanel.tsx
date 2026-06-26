// 업무 상세 우측 패널(§9.3) — ▾세부 사항 접이식. 담당자·레이블·상위·기한·시작일·Sprint·SP·보고자·측정.
// P2 섹션('개발 Git 연동'·'자동화')은 Phase1 제외. 각 필드 인라인 편집 → 해당 PATCH 즉시 반영.
import { useEffect, useState } from 'react';
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  DatePicker, Input, Avatar, AvatarFallback,
} from '@therecommerce/ds-ui';
import { fromIso, toIso, fmtDate } from '@/lib/date';
import { PRIORITY_LABEL, type WorkItemResponse, type Priority, type Sprint } from '@/types/domain';
import { useMembers } from '@/features/members/hooks';
import {
  useChangeAssignee, useUpdateWorkItem, useUpdateMeasure, useChangeSprint, useMeasureUnits,
} from '../hooks';
import { MeasureBar } from './MeasureBar';

interface Props {
  item: WorkItemResponse;
  sprints: Sprint[];
}

const UNASSIGNED = '__none__';
const NO_SPRINT = '__backlog__';

export function DetailSidePanel({ item, sprints }: Props) {
  const { data: members = [] } = useMembers(item.projectId);
  const { data: units = [] } = useMeasureUnits();
  const changeAssignee = useChangeAssignee(item.id, item.key);
  const update = useUpdateWorkItem(item.id, item.key);
  const updateMeasure = useUpdateMeasure(item.id, item.key);
  const changeSprint = useChangeSprint(item.id, item.key);

  const unit = units.find((u) => u.id === item.measureUnitId);

  return (
    <aside className="w-full shrink-0 lg:w-80">
      <Accordion type="multiple" defaultValue={['details', 'measure']} className="rounded-lg border border-border">
        <AccordionItem value="details">
          <AccordionTrigger className="px-3 text-sm font-medium">세부 사항</AccordionTrigger>
          <AccordionContent className="space-y-3 px-3 pb-3">
            {/* 담당자 */}
            <Row label="담당자">
              <Select
                value={item.assigneeId != null ? String(item.assigneeId) : UNASSIGNED}
                onValueChange={(v) =>
                  changeAssignee.mutate({ assigneeId: v === UNASSIGNED ? null : Number(v) })
                }
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="미배정" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED}>미배정</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.userId} value={String(m.userId)}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Row>

            {/* 보고자 */}
            <Row label="보고자">
              <Select
                value={item.reporterId != null ? String(item.reporterId) : UNASSIGNED}
                onValueChange={(v) =>
                  changeAssignee.mutate({ assigneeId: item.assigneeId ?? null, reporterId: v === UNASSIGNED ? null : Number(v) })
                }
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="없음" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED}>없음</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.userId} value={String(m.userId)}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Row>

            {/* 우선순위 */}
            <Row label="우선순위">
              <Select
                value={item.priority}
                onValueChange={(v) => update.mutate({ priority: v as Priority })}
              >
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(PRIORITY_LABEL) as Priority[]).map((p) => (
                    <SelectItem key={p} value={p}>{PRIORITY_LABEL[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Row>

            {/* 레이블 */}
            <Row label="레이블">
              <LabelsEditor
                value={item.labels ?? []}
                onCommit={(labels) => update.mutate({ labels })}
              />
            </Row>

            {/* Sprint */}
            <Row label="Sprint">
              <Select
                value={item.sprintId != null ? String(item.sprintId) : NO_SPRINT}
                onValueChange={(v) => changeSprint.mutate(v === NO_SPRINT ? null : Number(v))}
              >
                <SelectTrigger className="h-8"><SelectValue placeholder="백로그" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_SPRINT}>백로그</SelectItem>
                  {sprints.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Row>

            {/* Story point */}
            <Row label="Story point">
              <NumberField
                value={item.storyPoints ?? undefined}
                onCommit={(n) => update.mutate({ storyPoints: n ?? null })}
              />
            </Row>

            {/* 시작일 / 기한 */}
            <Row label="시작일">
              <DatePicker
                placeholder="시작일"
                value={fromIso(item.startDate)}
                onChange={(d) => update.mutate({ startDate: toIso(d) || null })}
              />
            </Row>
            <Row label="기한">
              <DatePicker
                placeholder="기한"
                value={fromIso(item.dueDate)}
                onChange={(d) => update.mutate({ dueDate: toIso(d) || null })}
              />
            </Row>

            {item.completedAt && (
              <Row label="완료">
                <span className="text-sm text-muted-foreground">{fmtDate(item.completedAt)}</span>
              </Row>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* 측정(단위·목표·현재값) — 측정단위가 지정된 항목만 의미 */}
        <AccordionItem value="measure">
          <AccordionTrigger className="px-3 text-sm font-medium">측정</AccordionTrigger>
          <AccordionContent className="space-y-3 px-3 pb-3">
            {item.measureUnitId == null ? (
              <p className="text-xs text-muted-foreground">측정 단위가 지정되지 않았습니다.</p>
            ) : (
              <>
                <MeasureBar
                  target={item.targetValue ?? undefined}
                  current={item.currentValue ?? undefined}
                  suffix={unit?.suffix ?? undefined}
                  unitName={unit?.name}
                />
                <Row label="목표값">
                  <NumberField
                    value={item.targetValue ?? undefined}
                    onCommit={(n) => updateMeasure.mutate({ targetValue: n ?? null })}
                  />
                </Row>
                <Row label="현재값">
                  <NumberField
                    value={item.currentValue ?? undefined}
                    onCommit={(n) => updateMeasure.mutate({ currentValue: n ?? null })}
                  />
                </Row>
              </>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </aside>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[5.5rem_1fr] items-center gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div>{children}</div>
    </div>
  );
}

// 숫자 인라인 편집 — blur/Enter 시 commit. 빈 값=undefined.
function NumberField({ value, onCommit }: { value?: number; onCommit: (n?: number) => void }) {
  const [draft, setDraft] = useState(value != null ? String(value) : '');
  useEffect(() => { setDraft(value != null ? String(value) : ''); }, [value]);
  function commit() {
    const trimmed = draft.trim();
    const n = trimmed === '' ? undefined : Number(trimmed);
    if (n != null && Number.isNaN(n)) { setDraft(value != null ? String(value) : ''); return; }
    if (n !== value) onCommit(n);
  }
  return (
    <Input
      type="number"
      className="h-8"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
    />
  );
}

// 레이블 편집 — 콤마/Enter로 토큰 추가. 간단 칩 + 입력.
function LabelsEditor({ value, onCommit }: { value: string[]; onCommit: (labels: string[]) => void }) {
  const [draft, setDraft] = useState('');
  function add() {
    const t = draft.trim();
    if (!t || value.includes(t)) { setDraft(''); return; }
    onCommit([...value, t]);
    setDraft('');
  }
  return (
    <div className="flex flex-col gap-1.5">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((l) => (
            <span key={l} className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs">
              {l}
              <button
                type="button"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => onCommit(value.filter((x) => x !== l))}
                aria-label={`${l} 제거`}
              >×</button>
            </span>
          ))}
        </div>
      )}
      <Input
        className="h-8"
        placeholder="레이블 추가"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } }}
        onBlur={add}
      />
    </div>
  );
}

export function AssigneeAvatar({ name }: { name?: string }) {
  return (
    <Avatar className="size-6">
      <AvatarFallback className="text-xs">{name?.[0] ?? '–'}</AvatarFallback>
    </Avatar>
  );
}
