import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Editor } from '@tiptap/react';
import {
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Undo2, Redo2,
  Highlighter, Type, Palette, ChevronDown, ImagePlus, Loader2, Sparkles,
} from 'lucide-react';
import { HIGHLIGHT_COLORS, TEXT_COLORS, FONT_FAMILIES, FONT_SIZES } from '../../types';
import { uploadNotebookImage, readFileAsDataURL, validateImageFile } from '../../services/imageUpload';
import { useNotebookStore } from '../../stores/notebookStore';

interface FormattingToolbarProps {
  editor: Editor | null;
  onToggleAI?: () => void;
  isAIOpen?: boolean;
}

interface DropdownProps {
  label: React.ReactNode;
  children: React.ReactNode;
  width?: number;
}

function Dropdown({ label, children, width = 160 }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onMouseDown={(e) => { e.preventDefault(); setOpen(o => !o); }}
        className="flex items-center gap-1 px-2 py-1.5 text-sm rounded-md hover:bg-gray-100 transition-colors text-gray-700 min-w-0 whitespace-nowrap"
      >
        {label}
        <ChevronDown size={12} className="text-gray-400" />
      </button>
      {open && (
        <div
          className="toolbar-dropdown absolute top-full mt-1 z-50 py-1 animate-pop-in"
          style={{ minWidth: width, left: 0 }}
        >
          <div onClick={() => setOpen(false)}>{children}</div>
        </div>
      )}
    </div>
  );
}

function ToolbarBtn({
  onClick, active, disabled, title, children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-md transition-colors ${
        active
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-gray-200 mx-1 flex-shrink-0" />;
}

export default function FormattingToolbar({ editor, onToggleAI, isAIOpen }: FormattingToolbarProps) {
  if (!editor) return null;

  const currentFontSize = editor.getAttributes('textStyle').fontSize || '15px';
  const currentFontFamily = editor.getAttributes('textStyle').fontFamily || 'Patrick Hand';
  const currentFamilyObj = FONT_FAMILIES.find(f => f.value === currentFontFamily);
  const currentFamilyLabel = currentFamilyObj ? currentFamilyObj.label.split(' ')[0] : 'Font';

  // Image upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeNotebook = useNotebookStore(s => s.activeNotebook);

  const handleImageFile = useCallback(async (file: File) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setUploadError((validation as any).error);
      setTimeout(() => setUploadError(''), 4000);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError('');

    if (activeNotebook?.id) {
      // Try Supabase Storage first
      const result = await uploadNotebookImage(file, activeNotebook.id, setUploadProgress);
      if (result.success) {
        editor.chain().focus().setImage({ src: result.url, alt: file.name }).run();
        setIsUploading(false);
        return;
      }
      // If bucket missing or error, fall back to base64
      console.warn('Supabase upload failed, using base64 fallback:', result.error);
    }

    // Base64 fallback (works offline and without bucket setup)
    try {
      const dataUrl = await readFileAsDataURL(file);
      editor.chain().focus().setImage({ src: dataUrl, alt: file.name }).run();
    } catch {
      setUploadError('Failed to insert image. Please try again.');
      setTimeout(() => setUploadError(''), 4000);
    }
    setIsUploading(false);
  }, [editor, activeNotebook]);

  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset so the same file can be re-selected
    e.target.value = '';
    await handleImageFile(file);
  };

  return (
    <div className="flex items-center gap-1.5 px-4 py-2 bg-white border-b border-stone-200 flex-wrap z-10 shadow-xs">
      {/* Undo/Redo */}
      <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
        <Undo2 size={15} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
        <Redo2 size={15} />
      </ToolbarBtn>

      <Divider />

      {/* Font Family */}
      <Dropdown
        label={<span className="text-xs font-semibold text-stone-700 min-w-[70px] text-left">{currentFamilyLabel}</span>}
        width={210}
      >
        {FONT_FAMILIES.map(f => (
          <button
            key={f.value}
            className="w-full text-left px-3 py-2 text-sm hover:bg-stone-50 transition-colors flex items-center justify-between"
            style={{ fontFamily: f.value }}
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().setFontFamily(f.value).run();
            }}
          >
            <span>{f.label}</span>
            {currentFontFamily === f.value && <span className="text-xs text-blue-600 font-bold">✓</span>}
          </button>
        ))}
      </Dropdown>

      <Divider />

      {/* Font Size */}
      <Dropdown
        label={<span className="text-xs font-semibold text-stone-700 min-w-[38px] text-center">{currentFontSize}</span>}
        width={110}
      >
        {FONT_SIZES.map(s => (
          <button
            key={s.value}
            className="w-full text-left px-3 py-1.5 text-xs hover:bg-stone-50 transition-colors flex items-center justify-between"
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().setFontSize(s.value).run();
            }}
          >
            <span>{s.label}</span>
            {currentFontSize === s.value && <span className="text-xs text-blue-600 font-bold">✓</span>}
          </button>
        ))}
      </Dropdown>

      <Divider />

      {/* Headings */}
      <Dropdown label={<span className="text-xs font-semibold text-stone-700">Heading</span>} width={150}>
        <button
          className="w-full text-left px-3 py-2 text-sm hover:bg-stone-50 font-normal"
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setParagraph().run(); }}
        >
          Normal Text
        </button>
        <button
          className="w-full text-left px-3 py-2 hover:bg-stone-50 font-bold text-base"
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 1 }).run(); }}
        >
          Heading 1
        </button>
        <button
          className="w-full text-left px-3 py-2 hover:bg-stone-50 font-semibold text-sm"
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run(); }}
        >
          Heading 2
        </button>
        <button
          className="w-full text-left px-3 py-2 hover:bg-stone-50 font-medium text-xs"
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 3 }).run(); }}
        >
          Heading 3
        </button>
      </Dropdown>

      <Divider />

      {/* Text Formatting */}
      <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
        <Bold size={15} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
        <Italic size={15} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
        <Underline size={15} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
        <Strikethrough size={15} />
      </ToolbarBtn>

      <Divider />

      {/* Alignment */}
      <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align Left">
        <AlignLeft size={15} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Center">
        <AlignCenter size={15} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align Right">
        <AlignRight size={15} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justify">
        <AlignJustify size={15} />
      </ToolbarBtn>

      <Divider />

      {/* Lists */}
      <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">
        <List size={15} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered List">
        <ListOrdered size={15} />
      </ToolbarBtn>

      <Divider />

      {/* Text Color */}
      <Dropdown label={<Palette size={15} />} width={160}>
        <div className="px-3 py-2">
          <p className="text-xs text-gray-500 mb-2 font-medium">Text Color</p>
          <div className="flex flex-wrap gap-2">
            {TEXT_COLORS.map(c => (
              <button
                key={c.value}
                title={c.label}
                className="color-swatch"
                style={{ backgroundColor: c.value }}
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setColor(c.value).run(); }}
              />
            ))}
          </div>
          <button
            className="mt-2 text-xs text-gray-500 hover:text-gray-700"
            onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().unsetColor().run(); }}
          >
            Reset color
          </button>
        </div>
      </Dropdown>

      {/* Highlight */}
      <Dropdown label={<Highlighter size={15} />} width={160}>
        <div className="px-3 py-2">
          <p className="text-xs text-gray-500 mb-2 font-medium">Highlight Color</p>
          <div className="flex flex-wrap gap-2">
            {HIGHLIGHT_COLORS.map(c => (
              <button
                key={c.value}
                title={c.label}
                className="color-swatch"
                style={{ backgroundColor: c.value }}
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHighlight({ color: c.value }).run(); }}
              />
            ))}
          </div>
          <button
            className="mt-2 text-xs text-gray-500 hover:text-gray-700"
            onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().unsetHighlight().run(); }}
          >
            Remove highlight
          </button>
        </div>
      </Dropdown>

      <Divider />

      {/* Insert Image */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
      <ToolbarBtn
        onClick={handleImageButtonClick}
        disabled={isUploading}
        title="Insert image (PNG, JPG, WEBP · max 8 MB)"
      >
        {isUploading ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />}
      </ToolbarBtn>
      {uploadError && (
        <span className="text-[11px] text-red-600 font-medium ml-1 max-w-[200px] truncate" title={uploadError}>
          {uploadError}
        </span>
      )}
      {isUploading && uploadProgress > 0 && uploadProgress < 100 && (
        <span className="text-[11px] text-stone-400 ml-1">{uploadProgress}%</span>
      )}

      <Divider />

      {/* AI Notes Button */}
      {onToggleAI && (
        <button
          onMouseDown={(e) => { e.preventDefault(); onToggleAI(); }}
          title="AI Notes – Generate notes with Gemini"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            isAIOpen
              ? 'bg-violet-600 text-white shadow-sm'
              : 'bg-gradient-to-r from-violet-50 to-indigo-50 text-violet-700 border border-violet-200 hover:from-violet-100 hover:to-indigo-100'
          }`}
        >
          <Sparkles size={13} />
          <span>AI</span>
        </button>
      )}

      {/* Type indicator */}
      <div className="ml-auto flex items-center gap-1 text-xs text-gray-400">
        <Type size={12} />
        <span>Formatting</span>
      </div>
    </div>
  );
}
