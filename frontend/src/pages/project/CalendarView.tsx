// 캘린더 탭 — 기한(due_date) 기준 월별 (P2 구현, WMP-VIEW-003).
// :key → useProjectByKey로 id 해소. year/month state로 GET ?year=&month= 재호출.
// CR-021: 빈칸 클릭 → 그 날짜 마감일 프리필 생성 모달, 칩 드래그 → 마감일 변경(낙관적).
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Skeleton } from '@therecommerce/ds-ui';
import { useProjectByKey } from '@/features/projects/hooks';
import { useCalendar, useMoveCalendarDueDate } from '@/features/view/hooks';
import { CalendarGrid } from '@/features/view/components/CalendarGrid';
import { useUiStore } from '@/store/ui-store';

// 로컬 기준 오늘(yyyy-MM-dd).
function todayLocal(): { year: number; month: number; iso: string } {
  const d = new Date();
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const iso = `${year}-${String(month).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { year, month, iso };
}

export function CalendarView() {
  const { key = '' } = useParams();
  const { data: project } = useProjectByKey(key);

  const t = todayLocal();
  const [ym, setYm] = useState({ year: t.year, month: t.month });
  const { data, isPending } = useCalendar(project?.id, ym.year, ym.month);

  const openCreateWith = useUiStore((s) => s.openCreateModalWith);
  const moveDue = useMoveCalendarDueDate(project?.id, ym.year, ym.month);

  if (isPending && !data) {
    return <Skeleton className="h-[32rem] w-full rounded-lg" />;
  }

  return (
    <CalendarGrid
      year={ym.year}
      month={ym.month}
      data={data}
      today={t.iso}
      onChangeMonth={(year, month) => setYm({ year, month })}
      onToday={() => setYm({ year: t.year, month: t.month })}
      onCreateOnDate={project ? (date) => openCreateWith({ projectId: project.id, dueDate: date }) : undefined}
      onMoveItem={project ? (itemId, toDate) => moveDue.mutate({ itemId, dueDate: toDate }) : undefined}
    />
  );
}
