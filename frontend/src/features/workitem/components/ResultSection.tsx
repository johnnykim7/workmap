// 결과(완료 산출물) 섹션 (WMP-WI-017, §9.3, CR-048) — 본문=지시 / 댓글=티키타카 / 결과=완료 산출물.
// 완료 상태(STATUS_CATEGORY==='DONE', 즉 DONE·OPS_APPLIED)일 때만 노출한다(완료 전엔 렌더 안 함).
// 결과 본문=공용 RichTextEditor(CR-024) 재사용, 결과 첨부=기존 업무 첨부 API 재사용(별도 저장소 없음).
import { useEffect, useState } from 'react';
import { Button } from '@therecommerce/ds-ui';
import { ChevronDown, ChevronRight, CheckCircle2, Pencil } from 'lucide-react';
import { type WorkItemResponse } from '@/types/domain';
import { RichTextEditor } from '@/components/common/rich-text-editor';
import { htmlToPlainText } from '@/lib/html-text';
import { UserAvatar } from '@/components/common/user-avatar';
import { useCanWrite } from '@/lib/permissions';
import { useUser } from '@/features/user/hooks';
import { Attachments } from './Attachments';
import { useSaveResult } from '../hooks';
import { isDoneStatus } from '../result-visibility';

export function ResultSection({ item }: { item: WorkItemResponse }) {
  // 완료 상태일 때만 노출. 완료 시 기본 펼침(결과를 바로 보이게).
  const [open, setOpen] = useState(true);
  if (!isDoneStatus(item)) return null;

  return (
    // 다른 섹션과 동일 구조 — 카드 박스 없이 제목을 밖으로. 접기 토글·초록 체크는 '완료 산출물' 신호로 유지.
    <section>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mb-2 flex w-full items-center gap-1.5 text-left"
      >
        {open ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
        <CheckCircle2 className="size-4 text-emerald-600" />
        <span className="text-sm font-semibold text-foreground">결과</span>
        <span className="text-xs text-muted-foreground">완료 산출물</span>
      </button>
      {open && (
        <div className="space-y-4">
          <ResultBody item={item} />
          <div>
            <h3 className="mb-1.5 text-xs font-semibold text-muted-foreground">결과물 파일</h3>
            {/* kind=RESULT — 본문 첨부(REFERENCE)와 분리(CR-051, BIZ-118). 같은 파일 중복 표시 방지. */}
            <Attachments item={item} kind="RESULT" />
          </div>
        </div>
      )}
    </section>
  );
}

// 결과 본문 — 읽기 HTML 렌더 → [편집] → 에디터 + 저장/취소. 하단에 작성자·시각.
function ResultBody({ item }: { item: WorkItemResponse }) {
  const canWrite = useCanWrite();
  const save = useSaveResult(item.id, item.key);
  const value = item.resultContent ?? '';
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => { if (!editing) setDraft(value); }, [value, editing]);

  const empty = htmlToPlainText(value).trim().length === 0;

  if (!editing) {
    return (
      <div className="group relative">
        {canWrite && (
          <button
            type="button"
            onClick={() => { setDraft(value); setEditing(true); }}
            className="absolute right-0 top-0 hidden items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground group-hover:inline-flex hover:text-foreground"
          >
            <Pencil className="size-3" /> 편집
          </button>
        )}
        {empty ? (
          <p
            className={canWrite ? 'cursor-text text-sm text-muted-foreground' : 'text-sm text-muted-foreground'}
            onClick={canWrite ? () => { setDraft(value); setEditing(true); } : undefined}
          >
            이 업무의 결과(무엇이 되었는지)를 입력하세요.
          </p>
        ) : (
          <RichTextEditor value={value} editable={false} />
        )}
        {!empty && item.resultWrittenBy && <ResultMeta item={item} />}
      </div>
    );
  }

  return (
    <div>
      <RichTextEditor value={draft} placeholder="결과를 입력하세요." onChange={setDraft} />
      <div className="mt-2 flex gap-2">
        <Button variant="primary" size="sm" disabled={save.isPending}
          onClick={() => { if (draft !== value) save.mutate(draft); setEditing(false); }}>저장</Button>
        <Button variant="ghost" size="sm" onClick={() => { setDraft(value); setEditing(false); }}>취소</Button>
      </div>
    </div>
  );
}

// 작성자·시각 표시(UserAvatar). result_written_by/at.
function ResultMeta({ item }: { item: WorkItemResponse }) {
  const { data: user } = useUser(item.resultWrittenBy ?? undefined);
  const at = item.resultWrittenAt ? new Date(item.resultWrittenAt).toLocaleString('ko-KR') : '';
  return (
    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
      <UserAvatar userId={item.resultWrittenBy ?? undefined} name={user?.name ?? ''} avatarUrl={user?.avatarUrl ?? undefined} size="xs" />
      <span>{user?.name ?? '작성자'}</span>
      {at && <span>· {at}</span>}
    </div>
  );
}
