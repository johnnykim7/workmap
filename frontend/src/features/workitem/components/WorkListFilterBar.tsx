// 통합 목록 퀵필터(§9.5) — 유형·상태·우선순위·담당자 Select + 키워드 검색.
// 같은 패턴(ALL 센티넬)으로 ProjectFilterBar와 일관. 변경 시 page 0으로 리셋은 상위에서 처리.
import type React from 'react';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SearchInput,
} from '@therecommerce/ds-ui';
import {
  WORK_STATUS_LABEL, PRIORITY_LABEL,
  type IssueType, type WorkStatus, type Priority, type ProjectMember,
} from '@/types/domain';
import { TypeOption } from '@/components/badges';
import type { WorkItemListParams } from '../list-api';

const ALL = 'ALL'; // Radix Select 빈 value 불가 → 전체 센티넬

// 표시할 상태 옵션(공통상태 전체 — 워크플로별 상위집합). 과밀 방지 위해 주요만.
const STATUS_OPTIONS: WorkStatus[] = [
  'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'DONE',
  'RECEIVED', 'PROCESSING', 'HOLD', 'OPS_APPLIED',
];

interface Props {
  params: WorkItemListParams;
  members: ProjectMember[];
  onChange: (patch: Partial<WorkItemListParams>) => void;
}

export function WorkListFilterBar({ params, members, onChange }: Props) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <SearchInput
        className="w-60"
        placeholder="제목·키 검색"
        value={params.keyword ?? ''}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ keyword: e.target.value })}
      />

      <Select
        value={params.issueType ?? ALL}
        onValueChange={(v) => onChange({ issueType: v === ALL ? undefined : (v as IssueType) })}
      >
        <SelectTrigger className="w-28"><SelectValue placeholder="유형" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>전체 유형</SelectItem>
          {(['EPIC', 'STORY', 'TASK', 'BUG', 'SUBTASK'] as IssueType[]).map((t) => (
            <SelectItem key={t} value={t}><TypeOption type={t} /></SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={params.commonStatus ?? ALL}
        onValueChange={(v) => onChange({ commonStatus: v === ALL ? undefined : (v as WorkStatus) })}
      >
        <SelectTrigger className="w-32"><SelectValue placeholder="상태" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>전체 상태</SelectItem>
          {STATUS_OPTIONS.map((s) => (
            <SelectItem key={s} value={s}>{WORK_STATUS_LABEL[s]}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={params.priority ?? ALL}
        onValueChange={(v) => onChange({ priority: v === ALL ? undefined : (v as Priority) })}
      >
        <SelectTrigger className="w-28"><SelectValue placeholder="우선순위" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>전체 우선순위</SelectItem>
          {(Object.keys(PRIORITY_LABEL) as Priority[]).map((p) => (
            <SelectItem key={p} value={p}>{PRIORITY_LABEL[p]}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={params.assigneeId != null ? String(params.assigneeId) : ALL}
        onValueChange={(v) => onChange({ assigneeId: v === ALL ? undefined : Number(v) })}
      >
        <SelectTrigger className="w-36"><SelectValue placeholder="담당자" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>전체 담당자</SelectItem>
          {members.map((m) => (
            <SelectItem key={m.userId} value={String(m.userId)}>{m.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
