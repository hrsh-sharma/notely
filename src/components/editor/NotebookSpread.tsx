import React, { useState, useRef, useCallback } from 'react';
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
import { Extension } from '@tiptap/core';
import type { Page } from '../../types';
import { useNotebookStore } from '../../stores/notebookStore';
import FormattingToolbar from './FormattingToolbar';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { FontSize } from './extensions/FontSize';
import { NotebookImage } from './extensions/NotebookImage';

function buildExtensions() {
  return [
    StarterKit.configure({
      heading: false, bulletList: false, orderedList: false, listItem: false,
    }),
    Heading.configure({ levels: [1, 2, 3] }),
    BulletList, OrderedList, ListItem,
    UnderlineExtension,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    TextStyle,
    FontFamily,
    Color,
    FontSize,
    Highlight.configure({ multicolor: true }),
    NotebookImage,
  ];
}

interface SinglePageEditorProps {
  page: Page;
  pageNumber: number;
  totalPages: number;
  isLeft: boolean;
  debounceMs?: number;
}

const DEBOUNCE_MS = 800;

function PageEditor({ page, pageNumber, totalPages, isLeft }: SinglePageEditorProps) {
  const savePage = useNotebookStore(s => s.savePage);
  const setSaveStatus = useNotebookStore(s => s.setSaveStatus);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPageIdRef = useRef(page.id);

  const editor = useEditor({
    extensions: buildExtensions(),
    content: (() => { try { return JSON.parse(page.content); } catch { return { type: 'doc', content: [{ type: 'paragraph' }] }; } })(),
    onUpdate: ({ editor }) => {
      setSaveStatus('saving');
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        savePage(page.id, JSON.stringify(editor.getJSON()));
      }, DEBOUNCE_MS);
    },
    editorProps: {
      attributes: { class: 'tiptap-editor', spellcheck: 'true' },
    },
  });

  React.useEffect(() => {
    if (!editor) return;
    if (prevPageIdRef.current !== page.id) {
      prevPageIdRef.current = page.id;
      try {
        editor.commands.setContent(JSON.parse(page.content), { emitUpdate: false });
      } catch {
        editor.commands.setContent({ type: 'doc', content: [{ type: 'paragraph' }] }, { emitUpdate: false });
      }
    }
  }, [editor, page.id, page.content]);

  React.useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  return { editor, pageNumber, totalPages, isLeft };
}

interface NotebookSpreadProps {
  leftPage: Page | null;
  rightPage: Page | null;
  leftIndex: number;
  rightIndex: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  onAddPage: () => void;
  spreadRef: React.RefObject<HTMLDivElement | null>;
}

export default function NotebookSpread({
  leftPage,
  rightPage,
  leftIndex,
  rightIndex,
  totalPages,
  onPrev,
  onNext,
  onAddPage,
  spreadRef,
}: NotebookSpreadProps) {
  const savePage = useNotebookStore(s => s.savePage);
  const setSaveStatus = useNotebookStore(s => s.setSaveStatus);
  const activeNotebook = useNotebookStore(s => s.activeNotebook);

  const leftDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rightDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leftPageIdRef = useRef(leftPage?.id ?? '');
  const rightPageIdRef = useRef(rightPage?.id ?? '');

  const leftEditor = useEditor({
    extensions: buildExtensions(),
    content: (() => { try { return JSON.parse(leftPage?.content ?? '{}'); } catch { return { type: 'doc', content: [{ type: 'paragraph' }] }; } })(),
    onUpdate: ({ editor }) => {
      setSaveStatus('saving');
      if (leftDebounceRef.current) clearTimeout(leftDebounceRef.current);
      leftDebounceRef.current = setTimeout(() => {
        if (leftPageIdRef.current) savePage(leftPageIdRef.current, JSON.stringify(editor.getJSON()));
      }, DEBOUNCE_MS);
    },
    editorProps: { attributes: { class: 'tiptap-editor', spellcheck: 'true' } },
  });

  const rightEditor = useEditor({
    extensions: buildExtensions(),
    content: (() => { try { return JSON.parse(rightPage?.content ?? '{}'); } catch { return { type: 'doc', content: [{ type: 'paragraph' }] }; } })(),
    onUpdate: ({ editor }) => {
      setSaveStatus('saving');
      if (rightDebounceRef.current) clearTimeout(rightDebounceRef.current);
      rightDebounceRef.current = setTimeout(() => {
        if (rightPageIdRef.current) savePage(rightPageIdRef.current, JSON.stringify(editor.getJSON()));
      }, DEBOUNCE_MS);
    },
    editorProps: { attributes: { class: 'tiptap-editor', spellcheck: 'true' } },
  });

  // Sync left page when it changes
  React.useEffect(() => {
    if (!leftEditor || !leftPage) return;
    if (leftPageIdRef.current !== leftPage.id) {
      leftPageIdRef.current = leftPage.id;
      try { leftEditor.commands.setContent(JSON.parse(leftPage.content)); }
      catch { leftEditor.commands.setContent({ type: 'doc', content: [{ type: 'paragraph' }] }); }
    }
  }, [leftEditor, leftPage?.id]);

  // Sync right page when it changes
  React.useEffect(() => {
    if (!rightEditor || !rightPage) return;
    if (rightPageIdRef.current !== rightPage.id) {
      rightPageIdRef.current = rightPage.id;
      try { rightEditor.commands.setContent(JSON.parse(rightPage.content)); }
      catch { rightEditor.commands.setContent({ type: 'doc', content: [{ type: 'paragraph' }] }); }
    }
  }, [rightEditor, rightPage?.id]);

  React.useEffect(() => () => {
    if (leftDebounceRef.current) clearTimeout(leftDebounceRef.current);
    if (rightDebounceRef.current) clearTimeout(rightDebounceRef.current);
  }, []);

  // Track which editor is currently active (left or right)
  const [focusedSide, setFocusedSide] = React.useState<'left' | 'right'>('left');

  React.useEffect(() => {
    if (!leftEditor) return;
    const handleFocus = () => setFocusedSide('left');
    leftEditor.on('focus', handleFocus);
    leftEditor.on('selectionUpdate', handleFocus);
    return () => {
      leftEditor.off('focus', handleFocus);
      leftEditor.off('selectionUpdate', handleFocus);
    };
  }, [leftEditor]);

  React.useEffect(() => {
    if (!rightEditor) return;
    const handleFocus = () => setFocusedSide('right');
    rightEditor.on('focus', handleFocus);
    rightEditor.on('selectionUpdate', handleFocus);
    return () => {
      rightEditor.off('focus', handleFocus);
      rightEditor.off('selectionUpdate', handleFocus);
    };
  }, [rightEditor]);

  const activeEditor = (focusedSide === 'right' && rightEditor) ? rightEditor : (leftEditor || rightEditor);

  const canPrev = leftIndex > 0;
  const canNext = rightIndex < totalPages - 1;

  return (
    <div className="flex flex-col h-full">
      {/* Formatting Toolbar */}
      <FormattingToolbar editor={activeEditor} />

      {/* Notebook Spread */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-auto" style={{ background: '#EDE8DC' }}>
        {/* Navigation Left */}
        <button
          onClick={onPrev}
          disabled={!canPrev}
          className={`mr-4 p-2 rounded-full shadow-md transition-all flex-shrink-0 ${
            canPrev
              ? 'bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 hover:shadow-lg'
              : 'bg-white/50 text-gray-300 cursor-not-allowed'
          }`}
        >
          <ChevronLeft size={22} />
        </button>

        {/* Two-Page Spread */}
        <div
          ref={spreadRef}
          className="flex shadow-2xl rounded-2xl overflow-hidden border border-stone-300/80"
          style={{
            height: 'min(calc(100vh - 180px), 820px)',
            width: 'min(calc(100vw - 200px), 1280px)',
            maxWidth: 1280,
          }}
        >
          {/* Left Page */}
          <div
            className="flex-1 flex flex-col relative overflow-hidden page-gutter-left"
            style={{ background: '#FEFDF8' }}
          >
            {/* Top Header Bar */}
            <div className="flex justify-between items-center px-6 py-2 border-b border-[#C8D8E8]/70 bg-white/40" style={{ paddingLeft: 'calc(var(--margin-width) + 16px)' }}>
              <span className="text-[11px] font-mono text-stone-400">
                PAGE {leftIndex + 1}
              </span>
              <div className="flex items-center gap-2 border border-pink-300/80 rounded px-2.5 py-0.5 bg-white/70 font-mono text-[10px] text-pink-700 shadow-2xs">
                <span className="font-bold text-pink-500">DATE:</span>
                <span>{leftPage?.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span className="text-pink-300">|</span>
                <span className="font-bold text-pink-500">NO:</span>
                <span className="font-bold text-stone-800">{leftIndex + 1}</span>
              </div>
            </div>

            {/* Writing area with dynamic paper style */}
            <div
              className={`flex-1 overflow-y-auto ${
                activeNotebook?.paperStyle === 'grid'
                  ? 'notebook-page-grid'
                  : activeNotebook?.paperStyle === 'dotted'
                  ? 'notebook-page-dotted'
                  : activeNotebook?.paperStyle === 'plain'
                  ? 'notebook-page-plain'
                  : 'notebook-page-lines'
              }`}
              onClick={() => {
                setFocusedSide('left');
                leftEditor?.commands.focus();
              }}
            >
              <EditorContent editor={leftEditor} className="h-full min-h-full" />
            </div>
          </div>

          {/* Realistic Center Spine & Crease */}
          <div
            className="relative w-6 flex-shrink-0 bg-[#E5DDCF] flex items-center justify-between border-l border-r border-[#CDC2B2] shadow-inner select-none"
          >
            {/* Left gutter deep shadow */}
            <div className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-black/25 to-transparent pointer-events-none" />
            {/* Thread stitching dashed line */}
            <div
              className="w-[1.5px] h-full mx-auto"
              style={{
                backgroundImage: 'repeating-linear-gradient(180deg, rgba(80,50,20,0.5) 0px, rgba(80,50,20,0.5) 5px, transparent 5px, transparent 10px)',
              }}
            />
            {/* Right gutter deep shadow */}
            <div className="absolute inset-y-0 right-0 w-2.5 bg-gradient-to-l from-black/25 to-transparent pointer-events-none" />
          </div>

          {/* Right Page */}
          <div
            className="flex-1 flex flex-col relative overflow-hidden page-gutter-right"
            style={{ background: '#FEFDF8' }}
          >
            {/* Top Header Bar */}
            <div className="flex justify-between items-center px-6 py-2 border-b border-[#C8D8E8]/70 bg-white/40" style={{ paddingLeft: 'calc(var(--margin-width) + 16px)' }}>
              <span className="text-[11px] font-mono text-stone-400">
                {rightPage ? `PAGE ${rightIndex + 1}` : ''}
              </span>
              {rightPage && (
                <div className="flex items-center gap-2 border border-pink-300/80 rounded px-2.5 py-0.5 bg-white/70 font-mono text-[10px] text-pink-700 shadow-2xs">
                  <span className="font-bold text-pink-500">DATE:</span>
                  <span>{rightPage?.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span className="text-pink-300">|</span>
                  <span className="font-bold text-pink-500">NO:</span>
                  <span className="font-bold text-stone-800">{rightIndex + 1}</span>
                </div>
              )}
            </div>

            {rightPage ? (
              <div
                className={`flex-1 overflow-y-auto ${
                  activeNotebook?.paperStyle === 'grid'
                    ? 'notebook-page-grid'
                    : activeNotebook?.paperStyle === 'dotted'
                    ? 'notebook-page-dotted'
                    : activeNotebook?.paperStyle === 'plain'
                    ? 'notebook-page-plain'
                    : 'notebook-page-lines right-page'
                }`}
                onClick={() => {
                  setFocusedSide('right');
                  rightEditor?.commands.focus();
                }}
              >
                <EditorContent editor={rightEditor} className="h-full min-h-full" />
              </div>
            ) : (
              // Empty right page when at last odd-numbered page
              <div
                className={`flex-1 flex items-center justify-center cursor-pointer group ${
                  activeNotebook?.paperStyle === 'grid'
                    ? 'notebook-page-grid'
                    : activeNotebook?.paperStyle === 'dotted'
                    ? 'notebook-page-dotted'
                    : activeNotebook?.paperStyle === 'plain'
                    ? 'notebook-page-plain'
                    : 'notebook-page-lines right-page'
                }`}
                onClick={onAddPage}
              >
                <div className="flex flex-col items-center gap-2 text-stone-400 group-hover:text-stone-700 transition-colors bg-white/80 px-5 py-4 rounded-2xl shadow-sm border border-stone-200">
                  <Plus size={24} />
                  <span className="text-xs font-semibold">Turn to Next Blank Page</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Right */}
        <button
          onClick={canNext ? onNext : onAddPage}
          className="ml-4 p-2 rounded-full shadow-md transition-all flex-shrink-0 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 hover:shadow-lg"
          title={canNext ? 'Next spread' : 'Add new page'}
        >
          {canNext ? <ChevronRight size={22} /> : <Plus size={22} />}
        </button>
      </div>

      {/* Page indicator */}
      <div className="flex items-center justify-center py-2 bg-white border-t border-gray-100">
        <span className="text-xs text-gray-400">
          {leftIndex + 1}–{rightPage ? rightIndex + 1 : leftIndex + 1} of {totalPages}
        </span>
      </div>
    </div>
  );
}
