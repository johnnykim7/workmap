import { LayoutDashboard } from 'lucide-react';
import { StubPage } from '@/components/common/stub-page';

// 회사 홈 (/) — 막힘 중심 대시보드(§9.2). Sprint5.
export function HomePage() {
  return (
    <StubPage
      title="회사 홈"
      desc="막힘·지연·미배정 중심 대시보드"
      sprint="Sprint5"
      icon={<LayoutDashboard className="size-6" />}
    />
  );
}
