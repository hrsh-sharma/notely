import React, { useEffect, useRef, useCallback } from 'react';
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
import { useAuthStore } from '../../stores/authStore';
import { NotebookImage } from './extensions/NotebookImage';

// Custom FontSize extension
const FontSize = Extension.create({
  name: 'fontSize',
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: el => el.style.fontSize || null,
            renderHTML: attrs => {
              if (!attrs.fontSize) return {};
              return { style: `font-size: ${attrs.fontSize}` };
            },
          },
        },
      },
    ];
  },
});

interface NotebookPageProps {
  page: Page;
  isActive: boolean;
  pageLabel: string;
  onEditorReady?: (editor: ReturnType<typeof useEditor>) => void;
}

const DEBOUNCE_MS = 800;

export default function NotebookPage({ page, isActive, pageLabel, onEditorReady }: NotebookPageProps) {
  const savePage = useNotebookStore(s => s.savePage);
  const setSaveStatus = useNotebookStore(s => s.setSaveStatus);
  const user = useAuthStore(s => s.user);
  const canEdit = Boolean(user) && isActive;

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pageIdRef = useRef(page.id);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      Heading.configure({ levels: [1, 2, 3] }),
      BulletList,
      OrderedList,
      ListItem,
      UnderlineExtension,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      FontFamily,
      TextStyle,
      Color,
      FontSize,
      NotebookImage,
      Highlight.configure({ multicolor: true }),
    ],
    content: (() => {
      try {
        return JSON.parse(page.content);
      } catch {
        return { type: 'doc', content: [{ type: 'paragraph' }] };
      }
    })(),
    editable: canEdit,
    onUpdate: ({ editor }) => {
      setSaveStatus('saving');
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const content = JSON.stringify(editor.getJSON());
        savePage(pageIdRef.current, content);
      }, DEBOUNCE_MS);
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
        spellcheck: 'true',
      },
    },
  });

  // Update editable when isActive or user login status changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(Boolean(user) && isActive);
    }
  }, [editor, isActive, user]);

  // Notify parent of editor instance
  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  // Update content when page changes (navigating between pages)
  useEffect(() => {
    if (!editor) return;
    if (pageIdRef.current !== page.id) {
      pageIdRef.current = page.id;
      try {
        const content = JSON.parse(page.content);
        editor.commands.setContent(content, { emitUpdate: false });
      } catch {
        editor.commands.setContent({ type: 'doc', content: [{ type: 'paragraph' }] }, { emitUpdate: false });
      }
    }
  }, [editor, page.id, page.content]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handlePageClick = useCallback(() => {
    if (editor && isActive) {
      editor.commands.focus();
    }
  }, [editor, isActive]);

  return (
    <div className="relative flex flex-col h-full" onClick={handlePageClick}>
      {/* Page Header */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b"
        style={{ borderColor: '#C8D8E8', minHeight: 32 }}
      >
        <div className="flex items-center gap-2">
          {page.date && (
            <span className="text-xs text-gray-400" style={{ paddingLeft: 'calc(var(--margin-width) + 12px)' }}>
              {page.date}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400 font-medium">{pageLabel}</span>
      </div>

      {/* Ruled Writing Area */}
      <div className="flex-1 overflow-hidden notebook-page-lines paper-texture">
        <EditorContent
          editor={editor}
          className="h-full"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
}

// Export the editor ref for use in parent components
export { };
