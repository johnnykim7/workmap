// 전역 [만들기] 모달 (§9.4 업무 만들기) — ds-ui Dialog. 네이티브 dialog 금지 규칙 준수.
// Sprint1 골격: 열고 닫기만. 실제 work_item 생성 폼은 Sprint3.
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@therecommerce/ds-ui';
import { useUiStore } from '@/store/ui-store';
import { EmptyState } from './empty-state';
import { Plus } from 'lucide-react';

export function CreateModal() {
  const open = useUiStore((s) => s.createModalOpen);
  const close = useUiStore((s) => s.closeCreateModal);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>업무 만들기</DialogTitle>
          <DialogDescription>새 업무 항목을 만듭니다.</DialogDescription>
        </DialogHeader>
        <EmptyState
          icon={<Plus className="size-6" />}
          title="만들기 폼은 Sprint3에서 구현됩니다"
          description="유형 선택 · 프로젝트 · 담당자 · 제목 입력 폼이 들어갑니다."
        />
      </DialogContent>
    </Dialog>
  );
}
