import { SlidersHorizontal } from 'lucide-react';
import { StubPage } from '@/components/common/stub-page';
// 필드 스킴 (/admin/field-schemes) — Admin. Sprint5.
export function FieldSchemesPage() {
  return (
    <StubPage title="필드 스킴" desc="유형/프로젝트별 필드 on/off (관리자)" sprint="Sprint5" icon={<SlidersHorizontal className="size-6" />} />
  );
}
