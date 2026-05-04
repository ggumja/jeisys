import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
  Bold, Italic, UnderlineIcon, AlignLeft, AlignCenter, AlignRight,
  Link as LinkIcon, Image as ImageIcon, List, ListOrdered,
  Heading2, Heading3, Undo, Redo, Minus
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = '내용을 입력하세요...',
  minHeight = '320px',
}: RichTextEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false, autolink: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `news/img_${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('marketing')
      .upload(path, file, { upsert: true });
    if (error) { console.error('Image upload error:', error); return null; }
    const { data: { publicUrl } } = supabase.storage.from('marketing').getPublicUrl(path);
    return publicUrl;
  }, []);

  const handleImageInsert = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    const url = await uploadImage(file);
    if (url) editor.chain().focus().setImage({ src: url }).run();
    e.target.value = '';
  }, [editor, uploadImage]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href;
    const url = window.prompt('링크 URL을 입력하세요', prev);
    if (url === null) return;
    if (url === '') { editor.chain().focus().unsetLink().run(); return; }
    editor.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  const btnBase = 'p-1.5 rounded hover:bg-neutral-100 transition-colors disabled:opacity-30';
  const btnActive = 'bg-neutral-200';

  return (
    <div className="border border-neutral-300 rounded overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-neutral-200 bg-neutral-50">
        {/* History */}
        <button type="button" onClick={() => editor.chain().focus().undo().run()} className={btnBase} title="실행취소"><Undo className="w-4 h-4" /></button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()} className={btnBase} title="다시실행"><Redo className="w-4 h-4" /></button>
        <span className="w-px h-5 bg-neutral-200 mx-1" />

        {/* Headings */}
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`${btnBase} ${editor.isActive('heading', { level: 2 }) ? btnActive : ''}`} title="제목2"><Heading2 className="w-4 h-4" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`${btnBase} ${editor.isActive('heading', { level: 3 }) ? btnActive : ''}`} title="제목3"><Heading3 className="w-4 h-4" /></button>
        <span className="w-px h-5 bg-neutral-200 mx-1" />

        {/* Format */}
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`${btnBase} ${editor.isActive('bold') ? btnActive : ''}`} title="굵게"><Bold className="w-4 h-4" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`${btnBase} ${editor.isActive('italic') ? btnActive : ''}`} title="기울임"><Italic className="w-4 h-4" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={`${btnBase} ${editor.isActive('underline') ? btnActive : ''}`} title="밑줄"><UnderlineIcon className="w-4 h-4" /></button>
        <span className="w-px h-5 bg-neutral-200 mx-1" />

        {/* Align */}
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={`${btnBase} ${editor.isActive({ textAlign: 'left' }) ? btnActive : ''}`} title="좌정렬"><AlignLeft className="w-4 h-4" /></button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`${btnBase} ${editor.isActive({ textAlign: 'center' }) ? btnActive : ''}`} title="가운데"><AlignCenter className="w-4 h-4" /></button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={`${btnBase} ${editor.isActive({ textAlign: 'right' }) ? btnActive : ''}`} title="우정렬"><AlignRight className="w-4 h-4" /></button>
        <span className="w-px h-5 bg-neutral-200 mx-1" />

        {/* Lists */}
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`${btnBase} ${editor.isActive('bulletList') ? btnActive : ''}`} title="글머리 기호"><List className="w-4 h-4" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`${btnBase} ${editor.isActive('orderedList') ? btnActive : ''}`} title="번호 목록"><ListOrdered className="w-4 h-4" /></button>
        <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} className={btnBase} title="구분선"><Minus className="w-4 h-4" /></button>
        <span className="w-px h-5 bg-neutral-200 mx-1" />

        {/* Link & Image */}
        <button type="button" onClick={setLink} className={`${btnBase} ${editor.isActive('link') ? btnActive : ''}`} title="링크 삽입"><LinkIcon className="w-4 h-4" /></button>
        <button type="button" onClick={() => imageInputRef.current?.click()} className={btnBase} title="이미지 삽입"><ImageIcon className="w-4 h-4" /></button>
        <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageInsert} />
      </div>

      {/* Editor Area */}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none px-4 py-3 focus-within:outline-none"
        style={{ minHeight }}
      />

      <style>{`
        .tiptap { outline: none; }
        .tiptap p.is-editor-empty:first-child::before {
          color: #aaa;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .tiptap img { max-width: 100%; height: auto; border-radius: 4px; margin: 8px 0; }
        .tiptap a { color: #2563eb; text-decoration: underline; }
        .tiptap h2 { font-size: 1.25rem; font-weight: 700; margin: 1rem 0 0.5rem; }
        .tiptap h3 { font-size: 1.1rem; font-weight: 700; margin: 0.75rem 0 0.4rem; }
        .tiptap ul { list-style: disc; padding-left: 1.5rem; }
        .tiptap ol { list-style: decimal; padding-left: 1.5rem; }
        .tiptap hr { border: none; border-top: 1px solid #e5e7eb; margin: 1rem 0; }
      `}</style>
    </div>
  );
}
