import React, { useState, useRef } from 'react';
import {
  ArrowLeft, Save, Download, Settings, Menu, BookOpen,
  LayoutTemplate, Smartphone, CheckCircle, AlertCircle, Loader2,
  FileDown, Printer,
} from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import type { SaveStatus, ViewMode, PaperStyle } from '../../types';
import { useNotebookStore } from '../../stores/notebookStore';
import { exportPageAsPDF, exportNotebookAsPDF, printElement } from '../../services/export';

interface NotebookToolbarProps {
  onBack: () => void;
  spreadRef: React.RefObject<HTMLDivElement | null>;
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  switch (status) {
    case 'saving':
      return (
        <span className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
          <Loader2 size={12} className="animate-spin" />
          Saving…
        </span>
      );
    case 'saved':
      return (
        <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
          <CheckCircle size={12} />
          Saved
        </span>
      );
    case 'error':
      return (
        <span className="flex items-center gap-1.5 text-xs text-red-500 font-medium">
          <AlertCircle size={12} />
          Error saving
        </span>
      );
    default:
      return null;
  }
}

export default function NotebookToolbar({ onBack, spreadRef }: NotebookToolbarProps) {
  const { activeNotebook, saveStatus, viewMode, setViewMode, toggleSidebar, pages, currentPageIndex, setPaperStyle } = useNotebookStore(
    useShallow(s => ({
      activeNotebook: s.activeNotebook,
      saveStatus: s.saveStatus,
      viewMode: s.viewMode,
      setViewMode: s.setViewMode,
      toggleSidebar: s.toggleSidebar,
      pages: s.pages,
      currentPageIndex: s.currentPageIndex,
      setPaperStyle: s.setPaperStyle,
    }))
  );

  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleExportCurrentPage = async () => {
    if (!spreadRef.current) return;
    setExportOpen(false);
    const filename = `${activeNotebook?.title || 'notebook'}-page-${currentPageIndex + 1}.pdf`;
    await exportPageAsPDF(spreadRef.current, filename);
  };

  const handleExportNotebook = async () => {
    setExportOpen(false);
    if (!spreadRef.current) return;
    const filename = `${activeNotebook?.title || 'notebook'}.pdf`;
    await exportPageAsPDF(spreadRef.current, filename);
  };

  const handlePrint = () => {
    setExportOpen(false);
    if (spreadRef.current) printElement(spreadRef.current);
  };

  const currentPaperStyle: PaperStyle = activeNotebook?.paperStyle || 'ruled';

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-white border-b border-stone-200 shadow-sm z-20">
      {/* Back to Library */}
      <button
        onClick={toggleSidebar}
        className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-600 transition-colors"
        title="Toggle sidebar thumbnails"
      >
        <Menu size={18} />
      </button>

      <button
        onClick={onBack}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-stone-100 text-stone-700 transition-colors text-xs font-semibold"
      >
        <ArrowLeft size={15} />
        <span>Library</span>
      </button>

      <div className="w-px h-5 bg-stone-200" />

      {/* Notebook info */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className="w-3.5 h-4.5 rounded-sm flex-shrink-0 shadow-sm border border-black/10"
          style={{ backgroundColor: activeNotebook?.coverColor || '#1E3A5F' }}
        />
        <div className="min-w-0">
          <span className="font-bold text-stone-900 text-sm truncate block leading-snug">
            {activeNotebook?.title}
          </span>
          <span className="text-[11px] font-medium text-stone-400 truncate block leading-none">
            {activeNotebook?.category || activeNotebook?.subject || 'General'}
          </span>
        </div>
      </div>

      {/* Save status */}
      <div className="ml-3 hidden sm:block">
        <SaveIndicator status={saveStatus} />
      </div>

      <div className="ml-auto flex items-center gap-2.5">
        {/* Paper style selector */}
        <div className="flex items-center gap-1 bg-stone-100 rounded-lg p-1 text-xs font-medium text-stone-600">
          <button
            onClick={() => setPaperStyle('ruled')}
            className={`px-2 py-1 rounded-md transition-all ${
              currentPaperStyle === 'ruled' ? 'bg-white text-stone-900 shadow-sm font-semibold' : 'hover:text-stone-900'
            }`}
            title="Ruled lined paper"
          >
            Ruled
          </button>
          <button
            onClick={() => setPaperStyle('grid')}
            className={`px-2 py-1 rounded-md transition-all ${
              currentPaperStyle === 'grid' ? 'bg-white text-stone-900 shadow-sm font-semibold' : 'hover:text-stone-900'
            }`}
            title="Grid / Graph paper"
          >
            Grid
          </button>
          <button
            onClick={() => setPaperStyle('dotted')}
            className={`px-2 py-1 rounded-md transition-all ${
              currentPaperStyle === 'dotted' ? 'bg-white text-stone-900 shadow-sm font-semibold' : 'hover:text-stone-900'
            }`}
            title="Dot grid journal paper"
          >
            Dots
          </button>
          <button
            onClick={() => setPaperStyle('plain')}
            className={`px-2 py-1 rounded-md transition-all ${
              currentPaperStyle === 'plain' ? 'bg-white text-stone-900 shadow-sm font-semibold' : 'hover:text-stone-900'
            }`}
            title="Plain blank paper"
          >
            Plain
          </button>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center bg-stone-100 rounded-lg p-0.5 gap-0.5">
          <button
            onClick={() => setViewMode('spread')}
            className={`p-1.5 rounded-md transition-colors ${viewMode === 'spread' ? 'bg-white shadow text-blue-600' : 'text-stone-500 hover:text-stone-700'}`}
            title="Two-page spread"
          >
            <LayoutTemplate size={15} />
          </button>
          <button
            onClick={() => setViewMode('single')}
            className={`p-1.5 rounded-md transition-colors ${viewMode === 'single' ? 'bg-white shadow text-blue-600' : 'text-stone-500 hover:text-stone-700'}`}
            title="Single page view"
          >
            <Smartphone size={15} />
          </button>
        </div>

        {/* Export */}
        <div className="relative" ref={exportRef}>
          <button
            onClick={() => setExportOpen(o => !o)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium transition-colors"
          >
            <Download size={15} />
            <span className="hidden sm:inline">Export</span>
          </button>
          {exportOpen && (
            <div className="toolbar-dropdown absolute right-0 top-full mt-1 w-48 animate-pop-in">
              <button
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={handleExportCurrentPage}
              >
                <FileDown size={14} />
                Current spread as PDF
              </button>
              <button
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={handleExportNotebook}
              >
                <FileDown size={14} />
                Notebook as PDF
              </button>
              <div className="border-t border-gray-100 my-1" />
              <button
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={handlePrint}
              >
                <Printer size={14} />
                Print
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
