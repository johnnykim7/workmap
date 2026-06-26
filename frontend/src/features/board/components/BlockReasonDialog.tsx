// 차단 사유 입력 다이얼로그 — BLOCKED 컬럼 드롭 시 먼저 사유 입력(BIZ-005).
// 네이티브 prompt 금지 → ds-ui Dialog + Textarea. 사유 없으면 확인 비활성.
import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Button, Textarea, Spinner,
} from '@therecommerce/ds-ui';

interface Props {
  open: boolean;
  itemTitle?: string;
  busy?: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export function BlockReasonDialog({ open, itemTitle, busy = false, onConfirm, onCancel }: Props) {
  const [reason, setReason] = useState('');
  const trimmed = reason.trim();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !busy && (onCancel(), setReason(''))}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>막힘 사유 입력</DialogTitle>
          <DialogDescription>
            {itemTitle ? `"${itemTitle}"을(를) 막힘으로 전환합니다. ` : ''}
            차단 사유는 필수입니다.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          autoFocus
          rows={3}
          placeholder="무엇이 막고 있나요? (예: API 응답 대기, 외부 승인 필요)"
          value={reason}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
        />
        <DialogFooter>
          <Button variant="ghost" disabled={busy} onClick={() => { onCancel(); setReason(''); }}>
            취소
          </Button>
          <Button
            variant="primary"
            disabled={busy || !trimmed}
            onClick={() => { onConfirm(trimmed); setReason(''); }}
          >
            {busy && <Spinner className="size-4" />}
            막힘으로 전환
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
