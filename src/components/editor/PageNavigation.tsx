import React from 'react';
import { Plus, Trash2, Copy, Lock } from 'lucide-react';
import type { Page } from '../../types';
import { useShallow } from 'zustand/react/shallow';
import { useNotebookStore } from '../../stores/notebookStore';
import { useAuthStore } from '../../stores/authStore';

interface PageThumbnailProps {
  page: Page;
  isActive: boolean;
  onClick: () => void;
  onRequireAuth?: () => void;
}

function PageThumbnail({ page, isActive, onClick, onRequireAuth }: PageThumbnailProps) {
  const deletePage = useNotebookStore(s => s.deletePage);
  const duplicatePage = useNotebookStore(s => s.duplicatePage);
  const pages = useNotebookStore(s => s.pages);
  const user = useAuthStore(s => s.user);

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      onRequireAuth?.();
      return;
    }
    duplicatePage(page.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      onRequireAuth?.();
      return;
    }
    deletePage(page.id);
  };

  return (
    <div
      className={`group relative cursor-pointer rounded-md overflow-hidden border-2 transition-all ${
        isActive
          ? 'border-blue-400 shadow-md shadow-blue-100'
          : 'border-transparent hover:border-gray-300'
      }`}
      onClick={onClick}
    >
      {/* Mini page preview */}
      <div
        className="page-thumbnail"
        style={{
          width: '100%',
          aspectRatio: '3/4',
          position: 'relative',
          fontSize: 4,
          overflow: 'hidden',
        }}
      >
        {/* Page number */}
        <div className="absolute bottom-1 right-1 text-[6px] text-gray-400 font-mono">
          {page.pageNumber}
        </div>
      </div>

      {/* Page number label */}
      <div className={`text-center py-1 text-xs font-medium ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
        {page.pageNumber}
      </div>

      {/* Action buttons on hover */}
      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleDuplicate}
          className="p-0.5 bg-white/90 rounded shadow text-gray-600 hover:text-blue-600"
          title={!user ? "Sign in to duplicate page" : "Duplicate page"}
        >
          <Copy size={10} />
        </button>
        {pages.length > 1 && (
          <button
            onClick={handleDelete}
            className="p-0.5 bg-white/90 rounded shadow text-gray-600 hover:text-red-600"
            title={!user ? "Sign in to delete page" : "Delete page"}
          >
            <Trash2 size={10} />
          </button>
        )}
      </div>
    </div>
  );
}

interface PageNavigationProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onRequireAuth?: () => void;
}

export default function PageNavigation({ searchQuery, onSearchChange, onRequireAuth }: PageNavigationProps) {
  const { pages, currentPageIndex, setCurrentPage, addPage, searchResults } = useNotebookStore(
    useShallow(s => ({
      pages: s.pages,
      currentPageIndex: s.currentPageIndex,
      setCurrentPage: s.setCurrentPage,
      addPage: s.addPage,
      searchResults: s.searchResults,
    }))
  );
  const user = useAuthStore(s => s.user);

  const displayPages = searchQuery.trim() && searchResults.length > 0 ? searchResults : pages;

  const handleAddPage = () => {
    if (!user) {
      onRequireAuth?.();
      return;
    }
    addPage();
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 border-r border-gray-200">
      {/* Search */}
      <div className="p-3 border-b border-gray-200">
        <input
          type="text"
          placeholder="Search pages..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-100 transition-colors"
        />
      </div>

      {/* Pages list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {displayPages.map((page) => {
          const actualIndex = pages.findIndex(p => p.id === page.id);
          return (
            <PageThumbnail
              key={page.id}
              page={page}
              isActive={actualIndex === currentPageIndex || actualIndex === currentPageIndex + 1}
              onClick={() => setCurrentPage(actualIndex % 2 === 0 ? actualIndex : actualIndex - 1)}
              onRequireAuth={onRequireAuth}
            />
          );
        })}
      </div>

      {/* Add page */}
      <div className="p-3 border-t border-gray-200">
        <button
          onClick={handleAddPage}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors font-medium"
          title={!user ? "Sign in to add a page" : "Add page"}
        >
          {!user ? <Lock size={12} className="text-amber-700" /> : <Plus size={14} />}
          <span>{!user ? 'Sign In to Add' : 'Add Page'}</span>
        </button>
      </div>
    </div>
  );
}
