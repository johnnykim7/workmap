// 담당자 id → 이름 해소 헬퍼. work_item 응답은 assigneeId만 주므로(BE), 멤버 목록으로 이름 매핑.
import { useMemo } from 'react';
import { useMembers } from './hooks';

export function useAssigneeName(projectId?: number) {
  const { data: members } = useMembers(projectId);
  return useMemo(() => {
    const map = new Map<number, string>();
    members?.forEach((m) => map.set(m.userId, m.name));
    return (id?: number | null): string | undefined => (id != null ? map.get(id) : undefined);
  }, [members]);
}
