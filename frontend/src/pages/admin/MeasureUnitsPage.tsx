import { Ruler } from 'lucide-react';
import { StubPage } from '@/components/common/stub-page';
// 측정 단위 마스터 (/admin/measure-units) — Admin. Sprint5.
export function MeasureUnitsPage() {
  return <StubPage title="측정 단위" desc="측정 단위 CRUD (관리자)" sprint="Sprint5" icon={<Ruler className="size-6" />} />;
}
