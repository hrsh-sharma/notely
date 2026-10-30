import React from 'react';
import { BookOpen, FileText, Calendar } from 'lucide-react';
import type { Notebook } from '../../types';

interface NotebookCardProps {
  notebook: Notebook;
  onClick: () => void;
}

function formatDate(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 86400000 * 7) return `${Math.floor(diff / 86400000)}d ago`;
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function NotebookCard({ notebook, onClick }: NotebookCardProps) {
  const coverColor = notebook.coverColor || '#E85D26';
  const category = notebook.category || notebook.subject || 'Notebook';

  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer select-none transition-all duration-300 ease-out hover:-translate-y-2"
      style={{ aspectRatio: '3 / 4' }}
    >
      {/* 3D Paper Stack Shadow on right edge */}
      <div
        className="absolute right-[-4px] top-[4px] bottom-[4px] w-[6px] rounded-r-md bg-[#FAF6EE] border-r border-[#D9D1C1] shadow-sm transition-all group-hover:right-[-6px]"
        style={{
          backgroundImage: 'repeating-linear-gradient(180deg, #E6DDD0, #E6DDD0 1px, #FFFDF8 1px, #FFFDF8 3px)',
        }}
      />

      {/* Main Notebook Cover */}
      <div
        className="relative w-full h-full rounded-2xl overflow-hidden shadow-lg group-hover:shadow-2xl transition-all duration-300 border border-black/15 flex flex-col justify-between"
        style={{
          backgroundColor: coverColor,
          backgroundImage: `
            linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0.2) 100%),
            radial-gradient(circle at 10% 15%, rgba(255,255,255,0.12) 0%, transparent 50%)
          `,
        }}
      >
        {/* Left Spine Binding Tape (Authentic physical notebook tape) */}
        <div className="absolute left-0 top-0 bottom-0 w-5 bg-stone-900/40 border-r border-black/30 flex items-center justify-center shadow-inner">
          {/* Subtle stitch dashes down spine */}
          <div
            className="w-[1.5px] h-full"
            style={{
              backgroundImage: 'repeating-linear-gradient(180deg, rgba(255,255,255,0.35) 0px, rgba(255,255,255,0.35) 4px, transparent 4px, transparent 8px)',
            }}
          />
        </div>

        {/* Notebook Cover Content */}
        <div className="relative z-10 flex-1 ml-7 mr-3.5 mt-4 mb-3 flex flex-col justify-between">
          {/* Top Header Badge */}
          <div className="flex items-center justify-between">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-black/25 text-white/90 border border-white/20 backdrop-blur-sm">
              {category}
            </span>
            <BookOpen size={14} className="text-white/60" />
          </div>

          {/* Classic Notebook Label Plate (Classmate & Stationery style) */}
          <div className="my-auto bg-[#FEFDF9] rounded-lg p-3.5 shadow-md border border-[#E2D8C6] transition-transform duration-200 group-hover:scale-[1.02]">
            <div className="border border-stone-300/80 rounded p-2.5 bg-white/70">
              <div className="flex items-center justify-between border-b border-stone-200 pb-1 mb-2">
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-stone-500 font-mono">
                  NOTEBOOK
                </span>
                <span className="text-[9px] text-stone-400 font-mono">
                  VOL. 1
                </span>
              </div>
              <h3 className="font-bold text-sm text-stone-900 leading-snug line-clamp-2">
                {notebook.title}
              </h3>
              {notebook.description && (
                <p className="text-[11px] text-stone-500 mt-1 line-clamp-1">
                  {notebook.description}
                </p>
              )}
            </div>
          </div>

          {/* Bottom Footer Info */}
          <div className="flex items-center justify-between text-[11px] text-white/80 font-medium pt-1">
            <div className="flex items-center gap-1 drop-shadow-sm">
              <FileText size={12} className="text-white/70" />
              <span>{notebook.pageCount} {notebook.pageCount === 1 ? 'page' : 'pages'}</span>
            </div>
            <div className="flex items-center gap-1 drop-shadow-sm">
              <Calendar size={12} className="text-white/70" />
              <span>{formatDate(notebook.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
