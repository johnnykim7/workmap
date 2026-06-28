// 메시지/답글 작성기 — 공용 RichTextEditor(Tiptap) 재사용 + 전송 버튼.
// 저장형식=HTML. 빈 내용이면 전송 비활성. 전송 후 에디터 비움.
import { useCallback, useState } from 'react';
import { Button } from '@therecommerce/ds-ui';
import { Send } from 'lucide-react';
import { RichTextEditor } from '@/components/common/rich-text-editor';
import { isEmptyHtml } from './chat-utils';

interface Props {
  placeholder?: string;
  busy?: boolean;
  onSend: (html: string) => void;
}

export function MessageComposer({ placeholder = '메시지를 입력하세요.', busy, onSend }: Props) {
  const [html, setHtml] = useState('');
  // RichTextEditor는 value 변경을 포커스 밖에서만 동기화 → 비우기 위해 remount 키 사용.
  const [editorKey, setEditorKey] = useState(0);

  const empty = isEmptyHtml(html);

  const submit = useCallback(() => {
    if (empty || busy) return;
    onSend(html);
    setHtml('');
    setEditorKey((k) => k + 1);
  }, [empty, busy, html, onSend]);

  return (
    <div className="rounded-md border border-border bg-background">
      <RichTextEditor
        key={editorKey}
        value=""
        onChange={setHtml}
        placeholder={placeholder}
        className="min-h-[80px]"
      />
      <div className="flex items-center justify-end border-t border-border px-2 py-1.5">
        <Button variant="primary" size="sm" onClick={submit} disabled={empty || busy}>
          <Send className="size-4" /> 보내기
        </Button>
      </div>
    </div>
  );
}
