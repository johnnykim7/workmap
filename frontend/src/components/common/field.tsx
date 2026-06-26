// 공통 폼 필드 래퍼 (CLAUDE.md: 라벨·에러·필수(*) 표기를 공통 Field로 통일).
// React Hook Form + Zod와 함께 사용. error=에러 메시지 문자열.
import type { ReactNode } from 'react';

export function Field({
  label,
  required,
  error,
  htmlFor,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
