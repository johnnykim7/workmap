import { Search } from 'lucide-react';
import { StubPage } from '@/components/common/stub-page';

// 검색 결과 (/search) — 전체 텍스트 검색 + 필터 패널(§13.9). Sprint5.
export function SearchPage() {
  return <StubPage title="검색" desc="전체 텍스트 검색 + 필터" sprint="Sprint5" icon={<Search className="size-6" />} />;
}
