// 공용 리치 텍스트 에디터(CR-024). work_item description 입력 — 만들기 모달·상세 동일 사용.
// Tiptap 기반(조직 일관성: axopm IssueEditor 동형). 저장형식=HTML 문자열.
// 이미지는 별도 파일 업로드(POST /files/upload) 후 URL만 <img src>로 삽입(바이너리 미저장).
// 색 절제 규칙: 색상 팔레트 미제공, 중립 톤 서식만(굵게/기울임/밑줄/제목/목록/링크/코드/인용/이미지/실행취소).
import { useEffect, useRef, useCallback, useState } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import { Link } from '@tiptap/extension-link';
import { Underline } from '@tiptap/extension-underline';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, List, ListOrdered, Link as LinkIcon,
  Code, Quote, Image as ImageIcon, Undo2, Redo2,
} from 'lucide-react';
import { Button, Input, Popover, PopoverContent, PopoverTrigger, cn } from '@therecommerce/ds-ui';
import { uploadFile } from '@/lib/upload';

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

interface Props {
  value: string;
  onChange?: (html: string) => void;
  editable?: boolean;
  placeholder?: string;
  className?: string;
  /** blur 시 콜백(상세 인라인 편집 commit용). */
  onBlur?: (html: string) => void;
}

export function RichTextEditor({
  value, onChange, editable = true, placeholder = '설명을 입력하세요.', className, onBlur,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      Image.configure({ allowBase64: false }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
    ],
    content: value || '',
    editable,
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
    onBlur: ({ editor }) => onBlur?.(editor.getHTML()),
  });

  // 외부 value 변경 동기화(포커스 중이 아닐 때만 — 입력 도중 덮어쓰기 방지).
  useEffect(() => {
    if (editor && !editor.isFocused) {
      const current = editor.getHTML();
      if (current !== (value || '')) editor.commands.setContent(value || '');
    }
  }, [editor, value]);

  useEffect(() => {
    if (editor && editor.isEditable !== editable) editor.setEditable(editable);
  }, [editor, editable]);

  const insertImage = useCallback(async (file: File) => {
    if (!editor || !ALLOWED_IMAGE_TYPES.includes(file.type)) return;
    setUploading(true);
    try {
      const res = await uploadFile(file);
      editor.chain().focus().setImage({ src: res.url, alt: file.name }).run();
    } finally {
      setUploading(false);
    }
  }, [editor]);

  const onPickImage = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void insertImage(file);
    e.target.value = '';
  }, [insertImage]);

  if (!editor) return null;

  // 읽기 전용: HTML 렌더만.
  if (!editable) {
    return <div className={cn('prose prose-sm max-w-none', className)} dangerouslySetInnerHTML={{ __html: value || '' }} />;
  }

  return (
    <div className={cn('rounded-md border border-border', className)}>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onPickImage} aria-hidden />
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/30 px-2 py-1.5">
        <ToolBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="실행 취소"><Undo2 className="h-4 w-4" /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="다시 실행"><Redo2 className="h-4 w-4" /></ToolBtn>
        <Divider />
        <ToolBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="굵게"><Bold className="h-4 w-4" /></ToolBtn>
        <ToolBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="기울임"><Italic className="h-4 w-4" /></ToolBtn>
        <ToolBtn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="밑줄"><UnderlineIcon className="h-4 w-4" /></ToolBtn>
        <ToolBtn active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="취소선"><Strikethrough className="h-4 w-4" /></ToolBtn>
        <Divider />
        <ToolBtn active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="제목 1"><Heading1 className="h-4 w-4" /></ToolBtn>
        <ToolBtn active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="제목 2"><Heading2 className="h-4 w-4" /></ToolBtn>
        <Divider />
        <ToolBtn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="글머리 목록"><List className="h-4 w-4" /></ToolBtn>
        <ToolBtn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="번호 목록"><ListOrdered className="h-4 w-4" /></ToolBtn>
        <Divider />
        <LinkButton editor={editor} />
        <ToolBtn active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()} title="인라인 코드"><Code className="h-4 w-4" /></ToolBtn>
        <ToolBtn active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="인용문"><Quote className="h-4 w-4" /></ToolBtn>
        <Divider />
        <ToolBtn onClick={() => fileInputRef.current?.click()} disabled={uploading} title={uploading ? '업로드 중…' : '이미지 삽입'}><ImageIcon className="h-4 w-4" /></ToolBtn>
      </div>
      <EditorContent
        editor={editor}
        className={cn(
          'min-h-[120px] px-3 py-2 text-sm',
          '[&_.tiptap]:outline-none [&_.tiptap]:min-h-[100px]',
          '[&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
          '[&_.tiptap_p.is-editor-empty:first-child::before]:text-muted-foreground',
          '[&_.tiptap_p.is-editor-empty:first-child::before]:float-left',
          '[&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none',
          '[&_.tiptap_h1]:text-lg [&_.tiptap_h1]:font-bold [&_.tiptap_h1]:mb-2 [&_.tiptap_h1]:mt-3',
          '[&_.tiptap_h2]:text-base [&_.tiptap_h2]:font-semibold [&_.tiptap_h2]:mb-1.5 [&_.tiptap_h2]:mt-2',
          '[&_.tiptap_p]:mb-1.5 [&_.tiptap_p]:leading-relaxed',
          '[&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_ul]:mb-1.5',
          '[&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5 [&_.tiptap_ol]:mb-1.5',
          '[&_.tiptap_a]:text-primary [&_.tiptap_a]:underline',
          '[&_.tiptap_code]:bg-muted [&_.tiptap_code]:px-1 [&_.tiptap_code]:rounded [&_.tiptap_code]:text-xs [&_.tiptap_code]:font-mono',
          '[&_.tiptap_blockquote]:border-l-4 [&_.tiptap_blockquote]:border-border [&_.tiptap_blockquote]:pl-3 [&_.tiptap_blockquote]:text-muted-foreground',
          '[&_.tiptap_img]:rounded [&_.tiptap_img]:max-w-full [&_.tiptap_img]:my-2',
        )}
      />
    </div>
  );
}

function ToolBtn({ onClick, active, title, disabled, children }: {
  onClick: () => void; active?: boolean; title: string; disabled?: boolean; children: React.ReactNode;
}) {
  return (
    <Button type="button" variant={active ? 'secondary' : 'ghost'} size="sm"
      onClick={onClick} title={title} disabled={disabled} className="h-7 w-7 shrink-0 p-0">
      {children}
    </Button>
  );
}

function Divider() {
  return <div className="mx-0.5 h-5 w-px shrink-0 bg-border" />;
}

function LinkButton({ editor }: { editor: Editor }) {
  const [url, setUrl] = useState('');
  const [open, setOpen] = useState(false);
  const isLink = editor.isActive('link');

  const apply = () => {
    if (!url.trim()) return;
    const href = url.startsWith('http') ? url : `https://${url}`;
    editor.chain().focus().setLink({ href }).run();
    setOpen(false); setUrl('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant={isLink ? 'secondary' : 'ghost'} size="sm" className="h-7 w-7 shrink-0 p-0"
          title={isLink ? '링크 제거' : '링크 삽입'}
          onClick={() => {
            if (isLink) { editor.chain().focus().unsetLink().run(); }
            else { setUrl(editor.getAttributes('link').href || ''); setOpen(true); }
          }}>
          <LinkIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <p className="mb-2 text-xs font-medium text-muted-foreground">링크 URL</p>
        <div className="flex gap-2">
          <Input placeholder="https://..." value={url} autoFocus
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && apply()} className="h-8 text-sm" />
          <Button size="sm" onClick={apply} className="h-8 shrink-0">적용</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
