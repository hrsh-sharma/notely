import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles, X, Send, Loader2, ChevronDown,
  BookOpen, Lightbulb, HelpCircle, AlignLeft, Wand2, Plus,
} from 'lucide-react';
import { callGemini, markdownToTipTapNodes } from '../../services/gemini';
import type { AIMode, AIRequest } from '../../services/gemini';
import { useNotebookStore } from '../../stores/notebookStore';

interface AIDashboardModalProps {
  onClose: () => void;
  onNotebookCreated?: (id: string) => void;
}

type NoteStyle = 'structured' | 'bullet' | 'cornell' | 'paragraph';

const MODE_OPTIONS = [
  { id: 'notes' as AIMode, label: 'Generate Notes', icon: <BookOpen size={14} />, placeholder: 'e.g. Photosynthesis, Newton\'s Laws, React Hooks, World War II…', description: 'Full structured notes on any topic' },
  { id: 'expand' as AIMode, label: 'Expand Idea', icon: <Lightbulb size={14} />, placeholder: 'e.g. Climate change effects, Machine learning basics…', description: 'Turn a brief idea into detailed notes' },
  { id: 'summarize' as AIMode, label: 'Summarize Text', icon: <AlignLeft size={14} />, placeholder: 'Paste the text you want to summarize…', description: 'Condense long text into key points' },
  { id: 'questions' as AIMode, label: 'Practice Q&A', icon: <HelpCircle size={14} />, placeholder: 'e.g. Calculus derivatives, Cell biology, SQL joins…', description: 'Generate Q&A for study practice' },
  { id: 'simplify' as AIMode, label: 'Simplify Text', icon: <Wand2 size={14} />, placeholder: 'Paste complex text to simplify…', description: 'Make difficult content easy to understand' },
];

const STYLE_OPTIONS: { id: NoteStyle; label: string }[] = [
  { id: 'structured', label: 'Structured (Headings + Bullets)' },
  { id: 'bullet', label: 'Bullet Points' },
  { id: 'cornell', label: 'Cornell Notes' },
  { id: 'paragraph', label: 'Paragraphs' },
];

export default function AIDashboardModal({ onClose, onNotebookCreated }: AIDashboardModalProps) {
  const [mode, setMode] = useState<AIMode>('notes');
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState<NoteStyle>('structured');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [generatedMarkdown, setGeneratedMarkdown] = useState('');
  const [notebookTitle, setNotebookTitle] = useState('');
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modeMenuRef = useRef<HTMLDivElement>(null);
  const styleMenuRef = useRef<HTMLDivElement>(null);

  const createNotebook = useNotebookStore(s => s.createNotebook);
  const openNotebook = useNotebookStore(s => s.openNotebook);
  const savePage = useNotebookStore(s => s.savePage);
  const pages = useNotebookStore(s => s.pages);

  const currentMode = MODE_OPTIONS.find(m => m.id === mode)!;
  const currentStyle = STYLE_OPTIONS.find(s => s.id === style)!;

  // Close dropdowns on outside click
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (modeMenuRef.current && !modeMenuRef.current.contains(e.target as Node)) setShowModeMenu(false);
      if (styleMenuRef.current && !styleMenuRef.current.contains(e.target as Node)) setShowStyleMenu(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [topic]);

  // Auto-fill notebook title from topic
  useEffect(() => {
    if (topic.trim() && !notebookTitle) {
      const clean = topic.trim().slice(0, 40);
      setNotebookTitle(clean.charAt(0).toUpperCase() + clean.slice(1));
    }
  }, [topic]);

  const handleGenerate = async () => {
    if (!topic.trim()) { setError('Please enter a topic or text.'); return; }
    setIsGenerating(true);
    setError('');
    setGeneratedMarkdown('');

    const req: AIRequest = { mode, topic: topic.trim(), style };
    const result = await callGemini(req);
    setIsGenerating(false);

    if (!result.success || !result.content) {
      setError(result.error || 'Something went wrong. Please try again.');
      return;
    }
    setGeneratedMarkdown(result.content);
    // Auto-set title from first heading in response if blank
    if (!notebookTitle) {
      const firstHeading = result.content.match(/^#+\s+(.+)/m);
      if (firstHeading) setNotebookTitle(firstHeading[1].replace(/\*\*/g, '').trim().slice(0, 50));
    }
  };

  const handleCreateNotebook = async () => {
    if (!generatedMarkdown) return;
    setIsCreating(true);
    try {
      const title = notebookTitle.trim() || topic.trim().slice(0, 40) || 'AI Notes';
      const notebook = await createNotebook({
        title,
        category: 'AI Notes',
        description: `Generated from: ${topic.trim().slice(0, 80)}`,
        coverColor: '#4338CA',
        coverPattern: 'solid',
        paperStyle: 'ruled',
      });

      // Open the notebook to load its first page
      await openNotebook(notebook.id);

      const storePages = useNotebookStore.getState().pages;
      if (storePages.length > 0) {
        const nodes = markdownToTipTapNodes(generatedMarkdown);
        const doc = { type: 'doc', content: nodes };
        await savePage(storePages[0].id, JSON.stringify(doc));
      }

      if (onNotebookCreated) {
        onNotebookCreated(notebook.id);
      }
      onClose();
    } catch (e) {
      setError('Failed to create notebook. Please try again.');
    }
    setIsCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 leading-none">AI Notes Generator</h2>
              <p className="text-xs text-stone-400 mt-0.5">Powered by Gemini 3.8 Flash</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Mode + Style row */}
          <div className="flex gap-3">
            {/* Mode */}
            <div className="flex-1" ref={modeMenuRef}>
              <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5 block">Mode</label>
              <div className="relative">
                <button
                  onClick={() => setShowModeMenu(o => !o)}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-700 hover:border-violet-300 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-violet-500">{currentMode.icon}</span>
                    <span className="font-medium">{currentMode.label}</span>
                  </span>
                  <ChevronDown size={13} className="text-stone-400" />
                </button>
                {showModeMenu && (
                  <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-stone-200 rounded-xl shadow-xl z-50 py-1 overflow-hidden">
                    {MODE_OPTIONS.map(opt => (
                      <button key={opt.id} onClick={() => { setMode(opt.id); setShowModeMenu(false); setGeneratedMarkdown(''); }}
                        className={`w-full text-left px-3 py-2.5 flex items-start gap-2.5 hover:bg-violet-50 transition-colors ${mode === opt.id ? 'bg-violet-50' : ''}`}>
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

            {/* Style */}
            {(mode === 'notes' || mode === 'expand' || mode === 'questions') && (
              <div className="flex-1" ref={styleMenuRef}>
                <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5 block">Note Style</label>
                <div className="relative">
                  <button
                    onClick={() => setShowStyleMenu(o => !o)}
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-700 hover:border-violet-300 transition-colors"
                  >
                    <span className="font-medium text-sm truncate">{currentStyle.label}</span>
                    <ChevronDown size={13} className="text-stone-400 flex-shrink-0 ml-1" />
                  </button>
                  {showStyleMenu && (
                    <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-stone-200 rounded-xl shadow-xl z-50 py-1">
                      {STYLE_OPTIONS.map(opt => (
                        <button key={opt.id} onClick={() => { setStyle(opt.id); setShowStyleMenu(false); }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-violet-50 transition-colors ${style === opt.id ? 'text-violet-700 bg-violet-50 font-semibold' : 'text-stone-700'}`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Topic input */}
          <div>
            <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5 block">
              {mode === 'summarize' || mode === 'simplify' ? 'Text to Process' : 'Topic / Subject'}
            </label>
            <textarea
              ref={textareaRef}
              value={topic}
              onChange={e => { setTopic(e.target.value); setError(''); }}
              onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); handleGenerate(); } }}
              placeholder={currentMode.placeholder}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-800 placeholder-stone-300 resize-none focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all min-h-[80px]"
              rows={3}
              disabled={isGenerating}
            />
            <p className="text-[10px] text-stone-400 mt-1">Tip: Press Ctrl/⌘+Enter to generate quickly</p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !topic.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold rounded-xl hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-[0.99]"
          >
            {isGenerating ? (<><Loader2 size={16} className="animate-spin" /><span>Generating with Gemini…</span></>) : (<><Sparkles size={16} /><span>Generate Notes</span></>)}
          </button>

          {/* Generated preview */}
          {generatedMarkdown && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-stone-200" />
                <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider px-2">Generated Preview</span>
                <div className="flex-1 h-px bg-stone-200" />
              </div>

              {/* Preview box */}
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 max-h-52 overflow-y-auto text-xs text-stone-700 leading-relaxed whitespace-pre-wrap font-mono">
                {generatedMarkdown}
              </div>

              {/* Notebook title input */}
              <div>
                <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5 block">Notebook Title</label>
                <input
                  type="text"
                  value={notebookTitle}
                  onChange={e => setNotebookTitle(e.target.value)}
                  placeholder="My AI Notes"
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                />
              </div>

              {/* Create notebook button */}
              <button
                onClick={handleCreateNotebook}
                disabled={isCreating}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-stone-900 text-amber-200 text-sm font-bold rounded-xl hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
              >
                {isCreating ? (<><Loader2 size={16} className="animate-spin" /><span>Creating Notebook…</span></>) : (<><Plus size={16} /><span>Create Notebook with These Notes</span></>)}
              </button>
              <p className="text-[10px] text-stone-400 text-center">A new indigo notebook will be created with your AI-generated notes inside.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

