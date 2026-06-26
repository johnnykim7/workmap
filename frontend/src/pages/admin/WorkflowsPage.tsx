import { GitBranch } from 'lucide-react';
import { StubPage } from '@/components/common/stub-page';
// 워크플로 편집기 (/admin/workflows) — Admin. 상태/전이 화이트리스트. Sprint5.
export function WorkflowsPage() {
  return <StubPage title="워크플로" desc="상태/전이 화이트리스트 (관리자)" sprint="Sprint5" icon={<GitBranch className="size-6" />} />;
}
