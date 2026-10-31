import React from 'react';
import { BookOpen, FileText, Calendar, Lock, Pin } from 'lucide-react';
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
  const hasPinLock = Boolean(
    notebook.isLocked ||
    (notebook.pinCode && notebook.pinCode.length === 4) ||
    (typeof window !== 'undefined' && localStorage.getItem(`notely_pin_${notebook.id}`))
  );

  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer select-none transition-all duration-300 ease-out hover:-translate-y-1.5"
      style={{ aspectRatio: '3 / 4' }}
    >
      {/* Paper page edge stack on right side */}
      <div
        className="absolute right-[-4px] top-[4px] bottom-[4px] w-[6px] rounded-r-md bg-[#FAF6EE] border-r border-[#D9D1C1] shadow-xs transition-all duration-300 group-hover:right-[-6px]"
        style={{
          backgroundImage: 'repeating-linear-gradient(180deg, #E6DDD0, #E6DDD0 1px, #FFFDF8 1px, #FFFDF8 3px)',
        }}
      />

      {/* Main Notebook Cover */}
      <div
        className="relative w-full h-full rounded-2xl overflow-hidden shadow-md group-hover:shadow-xl transition-all duration-300 border border-black/15 flex flex-col justify-between"
        style={{
          backgroundColor: coverColor,
          backgroundImage: `
            linear-gradient(135deg, rgba(255,255,255,0.16) 0%, rgba(0,0,0,0.18) 100%),
            radial-gradient(circle at 15% 15%, rgba(255,255,255,0.12) 0%, transparent 60%)
          `,
        }}
      >
        {/* Subtle Spine Crease (Realistic book hinge) */}
        <div className="absolute left-0 top-0 bottom-0 w-5 bg-gradient-to-r from-black/25 via-black/10 to-transparent pointer-events-none" />
        <div className="absolute left-[18px] top-0 bottom-0 w-[1px] bg-white/10 pointer-events-none" />
        <div className="absolute left-[19px] top-0 bottom-0 w-[1px] bg-black/15 pointer-events-none" />

        {/* Notebook Cover Content */}
        <div className="relative z-10 flex-1 ml-6 mr-3.5 mt-3.5 mb-3 flex flex-col justify-between">
          {/* Top Header Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-black/30 text-white/95 border border-white/20 backdrop-blur-sm shadow-xs truncate">
                {category}
              </span>
              {notebook.isPinned && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-amber-400 text-stone-900 border border-amber-300 shadow-xs flex-shrink-0"
                  title="Pinned to top"
                >
                  <Pin size={9} className="fill-stone-900" />
                  <span>Pinned</span>
                </span>
              )}
              {hasPinLock && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-amber-400/25 text-amber-200 border border-amber-300/30 backdrop-blur-sm shadow-xs flex-shrink-0"
                  title="Protected with PIN"
                >
                  <Lock size={9} />
                  <span>Lock</span>
                </span>
              )}
            </div>
            <BookOpen size={13} className="text-white/70 flex-shrink-0 ml-1" />
          </div>

          {/* Clean Embossed Parchment Title Plaque */}
          <div className="my-auto bg-[#FEFDF9] rounded-xl p-3.5 shadow-sm border border-[#E2D8C6] transition-transform duration-200 group-hover:scale-[1.01]">
            <div className="flex items-center justify-between border-b border-stone-200/80 pb-1 mb-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400 font-mono">
                NOTEBOOK
              </span>
              <span className="text-[9px] font-semibold text-stone-400 font-mono">
                {notebook.pageCount} {notebook.pageCount === 1 ? 'PAGE' : 'PAGES'}
              </span>
            </div>
            <h3 className="font-bold text-sm text-stone-900 leading-snug line-clamp-2">
              {notebook.title}
            </h3>
            {notebook.description && (
              <p className="text-[11px] text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                {notebook.description}
              </p>
            )}
          </div>

          {/* Bottom Footer Info */}
          <div className="flex items-center justify-between text-[11px] text-white/90 font-medium pt-1">
            <div className="flex items-center gap-1 drop-shadow-xs">
              <FileText size={12} className="text-white/75" />
              <span>{notebook.pageCount} {notebook.pageCount === 1 ? 'page' : 'pages'}</span>
            </div>
            <div className="flex items-center gap-1 drop-shadow-xs">
              <Calendar size={12} className="text-white/75" />
              <span>{formatDate(notebook.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
