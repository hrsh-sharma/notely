import React, { useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import UnderlineExtension from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import FontFamily from '@tiptap/extension-font-family';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import Heading from '@tiptap/extension-heading';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { Page } from '../../types';
import { useNotebookStore } from '../../stores/notebookStore';
import FormattingToolbar from './FormattingToolbar';
import { FontSize } from './extensions/FontSize';
import { NotebookImage } from './extensions/NotebookImage';

function buildExtensions() {
  return [
    StarterKit.configure({ heading: false, bulletList: false, orderedList: false, listItem: false }),
    Heading.configure({ levels: [1, 2, 3] }),
    BulletList, OrderedList, ListItem,
    UnderlineExtension,
    TextStyle,
    FontFamily,
    Color,
    FontSize,
    Highlight.configure({ multicolor: true }),
    NotebookImage,
  ];
}

const DEBOUNCE_MS = 800;

interface SinglePageViewProps {
  page: Page;
  pageIndex: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  onAddPage: () => void;
  spreadRef: React.RefObject<HTMLDivElement | null>;
}

export default function SinglePageView({
  page,
  pageIndex,
  totalPages,
  onPrev,
  onNext,
  onAddPage,
  spreadRef,
}: SinglePageViewProps) {
  const savePage = useNotebookStore(s => s.savePage);
  const setSaveStatus = useNotebookStore(s => s.setSaveStatus);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pageIdRef = useRef(page.id);

  const editor = useEditor({
    extensions: buildExtensions(),
    content: (() => { try { return JSON.parse(page.content); } catch { return { type: 'doc', content: [{ type: 'paragraph' }] }; } })(),
    onUpdate: ({ editor }) => {
      setSaveStatus('saving');
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        savePage(pageIdRef.current, JSON.stringify(editor.getJSON()));
      }, DEBOUNCE_MS);
    },
    editorProps: { attributes: { class: 'tiptap-editor', spellcheck: 'true' } },
  });

  React.useEffect(() => {
    if (!editor) return;
    if (pageIdRef.current !== page.id) {
      pageIdRef.current = page.id;
      try { editor.commands.setContent(JSON.parse(page.content), { emitUpdate: false }); }
      catch { editor.commands.setContent({ type: 'doc', content: [{ type: 'paragraph' }] }, { emitUpdate: false }); }
    }
  }, [editor, page.id, page.content]);

  React.useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const activeNotebook = useNotebookStore(s => s.activeNotebook);

  const paperClass = activeNotebook?.paperStyle === 'grid'
    ? 'notebook-page-grid'
    : activeNotebook?.paperStyle === 'dotted'
    ? 'notebook-page-dotted'
    : activeNotebook?.paperStyle === 'plain'
    ? 'notebook-page-plain'
    : 'notebook-page-lines';

  return (
    <div className="flex flex-col h-full">
      <FormattingToolbar editor={editor} />

      <div className="flex-1 flex items-center justify-center p-4 overflow-auto" style={{ background: '#EDE8DC' }}>
        <button
          onClick={onPrev}
          disabled={pageIndex === 0}
          className={`mr-3 p-2 rounded-full shadow-md flex-shrink-0 transition-all ${
            pageIndex > 0 ? 'bg-white hover:bg-gray-50 text-stone-700' : 'bg-white/50 text-stone-300 cursor-not-allowed'
          }`}
        >
          <ChevronLeft size={20} />
        </button>

        <div
          ref={spreadRef}
          className="flex flex-col shadow-2xl rounded-2xl overflow-hidden border border-stone-300/80"
          style={{
            height: 'min(calc(100vh - 160px), 820px)',
            width: 'min(calc(100vw - 120px), 640px)',
            background: '#FEFDF8',
          }}
        >
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-2 border-b border-[#C8D8E8]/70 bg-white/40" style={{ paddingLeft: 'calc(var(--margin-width) + 16px)' }}>
            <span className="text-[11px] font-mono text-stone-400">PAGE {pageIndex + 1}</span>
            <div className="flex items-center gap-2 border border-pink-300/80 rounded px-2.5 py-0.5 bg-white/70 font-mono text-[10px] text-pink-700 shadow-2xs">
              <span className="font-bold text-pink-500">DATE:</span>
              <span>{page?.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              <span className="text-pink-300">|</span>
              <span className="font-bold text-pink-500">NO:</span>
              <span className="font-bold text-stone-800">{pageIndex + 1}</span>
            </div>
          </div>

          {/* Paper page */}
          <div
            className={`flex-1 overflow-y-auto ${paperClass}`}
            onClick={() => editor?.commands.focus()}
          >
            <EditorContent editor={editor} className="h-full min-h-full" />
          </div>
        </div>

        <button
          onClick={pageIndex < totalPages - 1 ? onNext : onAddPage}
          className="ml-3 p-2 rounded-full shadow-md flex-shrink-0 bg-white hover:bg-gray-50 text-gray-600 transition-all"
          title={pageIndex < totalPages - 1 ? 'Next page' : 'Add page'}
        >
          {pageIndex < totalPages - 1 ? <ChevronRight size={20} /> : <Plus size={20} />}
        </button>
      </div>

      <div className="flex items-center justify-center py-2 bg-white border-t border-gray-100">
        <span className="text-xs text-gray-400">Page {pageIndex + 1} of {totalPages}</span>
      </div>
    </div>
  );
}
