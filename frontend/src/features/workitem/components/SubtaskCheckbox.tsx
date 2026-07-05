// 하위작업 행의 완료 체크박스 — 클릭만으로 DONE 토글(상세 진입 불필요, §9.3 라이트한 체크리스트).
// statusId는 부모 워크플로 보드 컬럼에서 해소(SubtaskList가 주입). 전이는 FSM 가드 경유(서버 권위).
// 낙관적 UI는 두지 않는다 — FSM 화이트리스트가 전이를 거부할 수 있어 서버 결과를 기다린다(거부 시 토스트).
import { Checkbox, Spinner } from '@therecommerce/ds-ui';
import { useChangeStatus } from '../hooks';
import { type WorkItemResponse } from '@/types/domain';

interface Props {
  subtask: WorkItemResponse;
  done: boolean;
  doneStatusId?: number; // 완료 컬럼 statusId(체크 시 대상)
  todoStatusId?: number; // 첫 미완료 컬럼 statusId(체크 해제 시 대상)
}

export function SubtaskCheckbox({ subtask, done, doneStatusId, todoStatusId }: Props) {
  const changeStatus = useChangeStatus(subtask.id, subtask.key);

  // 대상 statusId가 없으면(보드 미로딩·해당 카테고리 컬럼 부재) 토글 불가.
  const target = done ? todoStatusId : doneStatusId;
  const disabled = target == null || target === subtask.statusId || changeStatus.isPending;

  function toggle() {
    if (target == null || target === subtask.statusId) return;
    changeStatus.mutate({ toStatusId: target });
  }

  if (changeStatus.isPending) {
    return <Spinner className="size-4 shrink-0" />;
  }

  return (
    <Checkbox
      checked={done}
      disabled={disabled}
      onCheckedChange={toggle}
      onClick={(e) => e.stopPropagation()}
      aria-label={done ? '완료 해제' : '완료로 표시'}
      className="shrink-0"
    />
  );
}
