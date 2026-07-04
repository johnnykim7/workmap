// 파일 타입별 아이콘(CR-037). 색은 절제 — 타입 구분을 위한 최소 신호색만.
import {
  FileText, FileImage, FileSpreadsheet, FileArchive, FileCode, File as FileIcon,
} from 'lucide-react';
import { cn } from '@therecommerce/ds-ui';

function extOf(name?: string | null): string {
  if (!name) return '';
  const dot = name.lastIndexOf('.');
  return dot < 0 ? '' : name.slice(dot + 1).split(/[?#]/)[0].toLowerCase();
}

export function FileTypeIcon({ contentType, fileName, className }: {
  contentType?: string | null; fileName?: string | null; className?: string;
}) {
  const ct = (contentType || '').toLowerCase();
  const ext = extOf(fileName);

  if (ct.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'avif'].includes(ext))
    return <FileImage className={cn('text-muted-foreground', className)} />;
  if (ct === 'application/pdf' || ext === 'pdf')
    return <FileText className={cn('text-red-500', className)} />;
  if (ct.includes('spreadsheet') || ct === 'application/vnd.ms-excel' || ['xls', 'xlsx', 'csv'].includes(ext))
    return <FileSpreadsheet className={cn('text-green-600', className)} />;
  if (ct.includes('word') || ['doc', 'docx'].includes(ext))
    return <FileText className={cn('text-blue-600', className)} />;
  if (ct.includes('zip') || ['zip', 'tar', 'gz', '7z', 'rar'].includes(ext))
    return <FileArchive className={cn('text-amber-600', className)} />;
  if (['json', 'xml', 'html', 'js', 'ts', 'java', 'py', 'sql'].includes(ext))
    return <FileCode className={cn('text-muted-foreground', className)} />;
  return <FileIcon className={cn('text-muted-foreground', className)} />;
}
