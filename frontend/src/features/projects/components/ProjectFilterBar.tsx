// 프로젝트 필터 바 (T3-3 §프로젝트 목록 — 유형·상태 + 검색).
// 워크스페이스는 좌상단 스위처로 일원화(CR-018) — 여기엔 WS 필터 없음.
// BE 필터는 status/templateId. 유형은 templateId로 매핑. keyword는 클라 필터.
import type React from 'react';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  SearchInput,
} from '@therecommerce/ds-ui';
import {
  PROJECT_STATUS_LABEL, PROJECT_TEMPLATES,
  type ProjectStatus,
} from '@/types/domain';
import type { ProjectFilter } from '../api';

const ALL = 'ALL'; // Radix Select는 빈 문자열 value 불가 → 전체 선택 센티넬

interface Props {
  filter: ProjectFilter;
  onChange: (patch: Partial<ProjectFilter>) => void;
}

export function ProjectFilterBar({ filter, onChange }: Props) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <SearchInput
        className="min-w-0 flex-1"
        placeholder="프로젝트명·키 검색"
        value={filter.keyword ?? ''}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ keyword: e.target.value })}
      />

      <Select
        value={filter.templateId ? String(filter.templateId) : ALL}
        onValueChange={(v) => onChange({ templateId: v === ALL ? undefined : Number(v) })}
      >
        <SelectTrigger className="w-32 shrink-0"><SelectValue placeholder="유형" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>전체 유형</SelectItem>
          {PROJECT_TEMPLATES.map((t) => (
            <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filter.status ?? ALL}
        onValueChange={(v) => onChange({ status: v === ALL ? undefined : (v as ProjectStatus) })}
      >
        <SelectTrigger className="w-28 shrink-0"><SelectValue placeholder="상태" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>전체 상태</SelectItem>
          {/* 보관(ARCHIVED)은 기본 목록에서 제외(includeArchived=false) → 옵션에서도 뺀다 */}
          {(['PLANNING', 'ACTIVE', 'DONE'] as ProjectStatus[]).map((s) => (
            <SelectItem key={s} value={s}>{PROJECT_STATUS_LABEL[s]}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
