import { useParams } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { StubPage } from '@/components/common/stub-page';

// 업무 상세 (/work-items/:key) — 유형별 분기·우측 접이식 패널(§9.3). Sprint3.
export function WorkItemDetail() {
  const { key } = useParams();
  return (
    <StubPage
      title={key ?? '업무 상세'}
      desc="유형별 분기 · 우측 접이식 패널"
      sprint="Sprint3"
      icon={<FileText className="size-6" />}
    />
  );
}
