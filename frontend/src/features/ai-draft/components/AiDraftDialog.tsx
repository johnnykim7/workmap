// AI 업무 초안 다이얼로그 (WMP-WI-019, CR-050) — 서술 + 모드(Epic 초안 / 지정 Epic 하위 Story·Task).
// 결과는 백로그 "AI 초안" 구역에 자동 입력된다. ds-ui만(네이티브 위젯 금지).
import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Button, Textarea, Spinner,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@therecommerce/ds-ui';
import { Sparkles } from 'lucide-react';
import { Field } from '@/components/common/field';
import type { AiDraftMode } from '../api';

interface EpicOption {
  id: number;
  title: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  epics: EpicOption[];
  busy?: boolean;
  onSubmit: (body: { statement: string; mode: AiDraftMode; epicId?: number | null }) => void;
}

export function AiDraftDialog({ open, onOpenChange, epics, busy, onSubmit }: Props) {
  const [statement, setStatement] = useState('');
  const [mode, setMode] = useState<AiDraftMode>('epic');
  const [epicId, setEpicId] = useState<string>('');

  const canSubmit =
    statement.trim().length > 0 && (mode === 'epic' || (mode === 'story_task' && epicId !== ''));

  const submit = () => {
    if (!canSubmit) return;
    onSubmit({
      statement: statement.trim(),
      mode,
      epicId: mode === 'story_task' ? Number(epicId) : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5">
            <Sparkles className="size-4 text-primary" /> AI 초안
          </DialogTitle>
          <DialogDescription>
            무엇을 만들지 자연어로 적으면 AI가 초안을 제안합니다. 결과는 백로그에 <b>초안</b>으로 들어가며,
            검토 후 담기·수정·삭제할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Field label="무엇을 만들까요?" required>
            <Textarea
              rows={4}
              placeholder={
                mode === 'epic'
                  ? '예: 결제 기능 전반을 만들고 싶어요. 카드·간편결제·정기결제를 다룹니다.'
                  : '예: 이 Epic에 필요한 스토리와 작업을 뽑아주세요.'
              }
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
            />
          </Field>

          <Field label="생성 범위">
            <Select value={mode} onValueChange={(v) => setMode(v as AiDraftMode)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="epic">Epic 초안</SelectItem>
                <SelectItem value="story_task">지정 Epic 하위 Story·Task 초안</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {mode === 'story_task' && (
            <Field label="대상 Epic" required>
              {epics.length > 0 ? (
                <Select value={epicId} onValueChange={setEpicId}>
                  <SelectTrigger><SelectValue placeholder="Epic 선택" /></SelectTrigger>
                  <SelectContent>
                    {epics.map((e) => (
                      <SelectItem key={e.id} value={String(e.id)}>{e.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-xs text-muted-foreground">
                  먼저 Epic을 만들어 확정하면 그 하위로 Story·Task 초안을 뽑을 수 있습니다.
                </p>
              )}
            </Field>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            취소
          </Button>
          <Button variant="primary" onClick={submit} disabled={!canSubmit || busy}>
            {busy ? <Spinner className="size-4" /> : <Sparkles className="size-4" />}
            초안 생성
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
