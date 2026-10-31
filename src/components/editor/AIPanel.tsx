import React, { useState, useRef, useEffect } from 'react';
import type { Editor } from '@tiptap/react';
import {
  Sparkles, X, Send, Loader2, ChevronDown, RotateCcw,
  BookOpen, Lightbulb, HelpCircle, AlignLeft, Wand2,
} from 'lucide-react';
import { callGemini, markdownToTipTapNodes } from '../../services/gemini';
import type { AIMode, AIRequest } from '../../services/gemini';

interface AIPanelProps {
  editor: Editor | null;
  onClose: () => void;
}

type NoteStyle = 'structured' | 'bullet' | 'cornell' | 'paragraph';

interface ModeOption {
  id: AIMode;
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  description: string;
}

const MODE_OPTIONS: ModeOption[] = [
  {
    id: 'notes',
    label: 'Generate Notes',
    icon: <BookOpen size={14} />,
    placeholder: 'e.g. Photosynthesis, Newton\'s Laws, World War II, React Hooks…',
    description: 'Create full notes on any topic',
  },
  {
    id: 'expand',
    label: 'Expand Idea',
    icon: <Lightbulb size={14} />,
    placeholder: 'e.g. Climate change causes, Machine learning basics…',
    description: 'Turn a brief idea into detailed notes',
  },
  {
    id: 'summarize',
    label: 'Summarize Text',
    icon: <AlignLeft size={14} />,
    placeholder: 'Paste the text you want to summarize…',
    description: 'Condense long text into key points',
  },
  {
    id: 'questions',
    label: 'Practice Questions',
    icon: <HelpCircle size={14} />,
    placeholder: 'e.g. Calculus derivatives, Cell biology, SQL joins…',
    description: 'Generate Q&A for study practice',
  },
  {
    id: 'simplify',
    label: 'Simplify Text',
    icon: <Wand2 size={14} />,
    placeholder: 'Paste complex text to simplify…',
    description: 'Make difficult content easy to understand',
  },
];

const STYLE_OPTIONS: { id: NoteStyle; label: string }[] = [
  { id: 'structured', label: 'Structured (Headings + Bullets)' },
  { id: 'bullet', label: 'Bullet Points' },
  { id: 'cornell', label: 'Cornell Notes' },
  { id: 'paragraph', label: 'Paragraphs' },
];

export default function AIPanel({ editor, onClose }: AIPanelProps) {
  const [mode, setMode] = useState<AIMode>('notes');
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState<NoteStyle>('structured');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState('');
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [showModeMenu, setShowModeMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const styleMenuRef = useRef<HTMLDivElement>(null);
  const modeMenuRef = useRef<HTMLDivElement>(null);

  const currentMode = MODE_OPTIONS.find(m => m.id === mode)!;
  const currentStyle = STYLE_OPTIONS.find(s => s.id === style)!;

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (styleMenuRef.current && !styleMenuRef.current.contains(e.target as Node)) {
        setShowStyleMenu(false);
      }
      if (modeMenuRef.current && !modeMenuRef.current.contains(e.target as Node)) {
        setShowModeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 140)}px`;
  }, [topic]);

  const handleGenerate = async () => {
    const trimmed = topic.trim();
    if (!trimmed) {
      setError('Please enter a topic or text.');
      return;
    }

    setIsLoading(true);
    setError('');
    setPreview('');

    const req: AIRequest = { mode, topic: trimmed, style };
    const result = await callGemini(req);

    setIsLoading(false);

    if (!result.success || !result.content) {
      setError(result.error || 'Something went wrong. Please try again.');
      return;
    }

    setPreview(result.content);
  };

  const handleInsert = (replace = false) => {
    if (!editor || !preview) return;

    const nodes = markdownToTipTapNodes(preview);
    const doc = { type: 'doc', content: nodes };

    if (replace) {
      editor.commands.setContent(doc, { emitUpdate: true });
    } else {
      // Insert at end of document with a separator paragraph
      editor
        .chain()
        .focus('end')
        .insertContent([{ type: 'paragraph' }, ...nodes])
        .run();
    }

    setPreview('');
    setTopic('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FDFCF9] border-l border-stone-200 shadow-xl" style={{ width: 340, minWidth: 300 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 bg-white">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-sm">
            <Sparkles size={14} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-800 leading-none">AI Notes</p>
            <p className="text-[10px] text-stone-400 mt-0.5">Powered by Gemini</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
          title="Close AI panel"
        >
          <X size={15} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {/* Mode selector */}
        <div>
          <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5 block">Mode</label>
          <div className="relative" ref={modeMenuRef}>
            <button
              onClick={() => setShowModeMenu(o => !o)}
              className="w-full flex items-center justify-between px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-700 hover:border-violet-300 transition-colors shadow-xs"
            >
              <span className="flex items-center gap-2">
                <span className="text-violet-500">{currentMode.icon}</span>
                <span className="font-medium">{currentMode.label}</span>
              </span>
              <ChevronDown size={13} className="text-stone-400" />
            </button>
            {showModeMenu && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-stone-200 rounded-xl shadow-lg z-50 py-1 overflow-hidden">
                {MODE_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => { setMode(opt.id); setShowModeMenu(false); setPreview(''); }}
                    className={`w-full text-left px-3 py-2.5 flex items-start gap-2.5 hover:bg-violet-50 transition-colors ${mode === opt.id ? 'bg-violet-50' : ''}`}
                  >
                    <span className="text-violet-400 mt-0.5 flex-shrink-0">{opt.icon}</span>
                    <div>
                      <p className={`text-sm font-medium leading-none ${mode === opt.id ? 'text-violet-700' : 'text-stone-700'}`}>{opt.label}</p>
                      <p className="text-[11px] text-stone-400 mt-0.5">{opt.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Style selector (only for notes/expand/questions) */}
        {(mode === 'notes' || mode === 'expand' || mode === 'questions') && (
          <div>
            <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5 block">Note Style</label>
            <div className="relative" ref={styleMenuRef}>
              <button
                onClick={() => setShowStyleMenu(o => !o)}
                className="w-full flex items-center justify-between px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-700 hover:border-violet-300 transition-colors shadow-xs"
              >
                <span className="font-medium">{currentStyle.label}</span>
                <ChevronDown size={12} className="text-stone-400" />
              </button>
              {showStyleMenu && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-stone-200 rounded-xl shadow-lg z-50 py-1 overflow-hidden">
                  {STYLE_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => { setStyle(opt.id); setShowStyleMenu(false); }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-violet-50 transition-colors ${style === opt.id ? 'text-violet-700 bg-violet-50 font-semibold' : 'text-stone-700'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Topic / Text input */}
        <div>
          <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5 block">
            {mode === 'summarize' || mode === 'simplify' ? 'Text to Process' : 'Topic'}
          </label>
          <textarea
            ref={textareaRef}
            value={topic}
            onChange={e => { setTopic(e.target.value); setError(''); }}
            onKeyDown={handleKeyDown}
            placeholder={currentMode.placeholder}
            className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-800 placeholder-stone-300 resize-none focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all shadow-xs min-h-[72px]"
            rows={3}
            disabled={isLoading}
          />
          <p className="text-[10px] text-stone-400 mt-1">⌘/Ctrl+Enter to generate</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-xs text-red-700 leading-relaxed">
            {error}
          </div>
        )}

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={isLoading || !topic.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
        >
          {isLoading ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              <span>Generating…</span>
            </>
          ) : (
            <>
              <Sparkles size={15} />
              <span>Generate Notes</span>
            </>
          )}
        </button>

        {/* Preview / Result */}
        {preview && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Preview</p>
              <button
                onClick={() => { setPreview(''); }}
                className="p-1 rounded hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
                title="Clear preview"
              >
                <RotateCcw size={11} />
              </button>
            </div>

            {/* Markdown preview box */}
            <div className="bg-white border border-stone-200 rounded-xl p-3 max-h-64 overflow-y-auto text-xs text-stone-700 leading-relaxed whitespace-pre-wrap font-mono shadow-xs">
              {preview}
            </div>

            {/* Insert actions */}
            <div className="flex gap-2">
              <button
                onClick={() => handleInsert(false)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-stone-900 text-white text-xs font-semibold rounded-xl hover:bg-stone-800 transition-colors shadow-xs"
                title="Append to current page"
              >
                <Send size={12} />
                Insert
              </button>
              <button
                onClick={() => handleInsert(true)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-700 border border-red-200 text-xs font-semibold rounded-xl hover:bg-red-100 transition-colors"
                title="Replace entire page content"
              >
                Replace Page
              </button>
            </div>
            <p className="text-[10px] text-stone-400 text-center">
              <strong>Insert</strong> appends to page · <strong>Replace</strong> overwrites page
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-stone-200 bg-white">
        <p className="text-[10px] text-stone-400 text-center leading-relaxed">
          AI can make mistakes. Always review generated notes.
        </p>
      </div>
    </div>
  );
}

