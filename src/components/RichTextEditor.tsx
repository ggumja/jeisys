import { useRef, useEffect } from 'react';
import { Bold, Italic, List, AlignLeft, Link as LinkIcon, Image as ImageIconEditor } from 'lucide-react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onImageUpload?: (file: File) => Promise<string>;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, onImageUpload, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        let imageUrl = '';
        if (onImageUpload) {
          imageUrl = await onImageUpload(file);
        } else {
          // Fallback to Base64 if no upload handler provided
          const reader = new FileReader();
          imageUrl = await new Promise((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        }

        const img = `<img src="${imageUrl}" alt="Uploaded image" style="max-width: 100%; height: auto; margin: 10px 0;" />`;
        document.execCommand('insertHTML', false, img);
        handleInput();
      } catch (error) {
        console.error('Failed to upload image:', error);
        alert('이미지 업로드에 실패했습니다.');
      }
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLink = () => {
    const url = prompt('링크 URL을 입력하세요:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  return (
    <div className="border border-neutral-300">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 bg-neutral-50 border-b border-neutral-300">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => execCommand('bold')}
          className="h-8 w-8"
          title="굵게"
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => execCommand('italic')}
          className="h-8 w-8"
          title="기울임"
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Separator orientation="vertical" className="h-6 mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => execCommand('insertUnorderedList')}
          className="h-8 w-8"
          title="목록"
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => execCommand('justifyLeft')}
          className="h-8 w-8"
          title="왼쪽 정렬"
        >
          <AlignLeft className="w-4 h-4" />
        </Button>
        <Separator orientation="vertical" className="h-6 mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleLink}
          className="h-8 w-8"
          title="링크 추가"
        >
          <LinkIcon className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          className="h-8 w-8"
          title="이미지 추가"
        >
          <ImageIconEditor className="w-4 h-4" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        <Separator orientation="vertical" className="h-6 mx-1" />
        <select
          onChange={(e) => {
            execCommand('formatBlock', e.target.value);
            e.target.value = 'p';
          }}
          className="px-2 py-1 text-sm border-none bg-transparent hover:bg-neutral-200 transition-colors rounded"
          defaultValue="p"
        >
          <option value="p">본문</option>
          <option value="h1">제목 1</option>
          <option value="h2">제목 2</option>
          <option value="h3">제목 3</option>
        </select>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="min-h-[300px] p-4 text-neutral-900 focus:outline-none prose prose-sm max-w-none"
        style={{
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
        }}
        data-placeholder={placeholder}
      />

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #a3a3a3;
        }
        [contenteditable] img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 10px 0;
        }
        [contenteditable] h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 0.67em 0;
        }
        [contenteditable] h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.75em 0;
        }
        [contenteditable] h3 {
          font-size: 1.17em;
          font-weight: bold;
          margin: 0.83em 0;
        }
        [contenteditable] ul {
          list-style: disc;
          margin-left: 20px;
          padding-left: 20px;
        }
        [contenteditable] a {
          color: #2563eb;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}