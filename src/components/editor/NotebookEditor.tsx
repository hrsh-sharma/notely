import React, { useRef, useState, useCallback } from 'react';
import type { Editor } from '@tiptap/react';
import { Lock, LogIn } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useNotebookStore } from '../../stores/notebookStore';
import { useAuthStore } from '../../stores/authStore';
import NotebookToolbar from './NotebookToolbar';
import NotebookSpread from './NotebookSpread';
import SinglePageView from './SinglePageView';
import PageNavigation from './PageNavigation';
import AuthModal from '../auth/AuthModal';
import AIPanel from './AIPanel';

interface NotebookEditorProps {
  onBack: () => void;
}

export default function NotebookEditor({ onBack }: NotebookEditorProps) {
  const {
    pages,
    currentPageIndex,
    viewMode,
    isSidebarOpen,
    searchQuery,
    setCurrentPage,
    addPage,
    setSearchQuery,
    searchPages,
  } = useNotebookStore(
    useShallow(s => ({
      pages: s.pages,
      currentPageIndex: s.currentPageIndex,
      viewMode: s.viewMode,
      isSidebarOpen: s.isSidebarOpen,
      searchQuery: s.searchQuery,
      setCurrentPage: s.setCurrentPage,
      addPage: s.addPage,
      setSearchQuery: s.setSearchQuery,
      searchPages: s.searchPages,
    }))
  );

  const user = useAuthStore(s => s.user);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // ── AI Panel ────────────────────────────────────────────────────────────────
  const [isAIOpen, setIsAIOpen] = useState(false);
  const activeEditorRef = useRef<Editor | null>(null);
  const [activeEditorState, setActiveEditorState] = useState<Editor | null>(null);

  const handleActiveEditorChange = useCallback((editor: Editor | null) => {
    activeEditorRef.current = editor;
    setActiveEditorState(editor);
  }, []);

  const toggleAI = useCallback(() => {
    setIsAIOpen(o => !o);
  }, []);

  // ── Spread logic ────────────────────────────────────────────────────────────
  const spreadRef = useRef<HTMLDivElement | null>(null);

  const leftPageIndex = viewMode === 'spread'
    ? (currentPageIndex % 2 === 0 ? currentPageIndex : currentPageIndex - 1)
    : currentPageIndex;
  const rightPageIndex = leftPageIndex + 1;

  const leftPage = pages[leftPageIndex] ?? null;
  const rightPage = pages[rightPageIndex] ?? null;

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    searchPages(q);
  };

  const handlePrev = () => {
    if (viewMode === 'spread') {
      setCurrentPage(Math.max(0, leftPageIndex - 2));
    } else {
      setCurrentPage(Math.max(0, currentPageIndex - 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'spread') {
      setCurrentPage(Math.min(pages.length - 1, rightPageIndex + 1));
    } else {
      setCurrentPage(Math.min(pages.length - 1, currentPageIndex + 1));
    }
  };

  const handleAddPage = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (viewMode === 'spread') {
      addPage(rightPage ? rightPageIndex : leftPageIndex);
    } else {
      addPage(currentPageIndex);
    }
  };

  if (pages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">Loading pages…</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Top toolbar */}
      <NotebookToolbar onBack={onBack} spreadRef={spreadRef} onToggleAI={toggleAI} isAIOpen={isAIOpen} />

      {/* Guest Mode Notice Banner */}
      {!user && (
        <div className="bg-amber-100/95 border-b border-amber-200/90 px-5 py-2 flex items-center justify-between gap-3 text-xs text-stone-800 shadow-xs z-20">
          <div className="flex items-center gap-2">
            <Lock size={13} className="text-amber-800 flex-shrink-0" />
            <span>
              <strong>Read-Only Mode:</strong> You are viewing as a guest. Please sign in or register to write notes, edit text, or add new pages.
            </span>
          </div>
          <button
            onClick={() => setShowAuthModal(true)}
            className="px-3 py-1 bg-stone-900 text-amber-200 rounded-lg font-semibold text-xs hover:bg-stone-800 transition-colors flex items-center gap-1.5 flex-shrink-0"
          >
            <LogIn size={13} />
            <span>Sign In to Edit</span>
          </button>
        </div>
      )}

      {/* Main content area: sidebar + editor + AI panel */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar: page navigation */}
        {isSidebarOpen && (
          <div className="w-[100px] flex-shrink-0 flex flex-col animate-slide-in" style={{ minWidth: 88, maxWidth: 112 }}>
            <PageNavigation
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              onRequireAuth={() => setShowAuthModal(true)}
            />
          </div>
        )}

        {/* Main writing area */}
        <div className="flex-1 min-w-0 flex flex-col">
          {viewMode === 'spread' ? (
            <NotebookSpread
              leftPage={leftPage}
              rightPage={rightPage}
              leftIndex={leftPageIndex}
              rightIndex={rightPageIndex}
              totalPages={pages.length}
              onPrev={handlePrev}
              onNext={handleNext}
              onAddPage={handleAddPage}
              spreadRef={spreadRef}
              onActiveEditorChange={handleActiveEditorChange}
              onToggleAI={toggleAI}
              isAIOpen={isAIOpen}
            />
          ) : (
            <SinglePageView
              page={pages[currentPageIndex]}
              pageIndex={currentPageIndex}
              totalPages={pages.length}
              onPrev={handlePrev}
              onNext={handleNext}
              onAddPage={handleAddPage}
              spreadRef={spreadRef}
              onActiveEditorChange={handleActiveEditorChange}
              onToggleAI={toggleAI}
              isAIOpen={isAIOpen}
            />
          )}
        </div>

        {/* AI Panel — slides in from the right */}
        {isAIOpen && (
          <div className="flex-shrink-0 border-l border-stone-200 overflow-hidden ai-panel-enter">
            <AIPanel
              editor={activeEditorState}
              onClose={() => setIsAIOpen(false)}
            />
          </div>
        )}
      </div>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}
