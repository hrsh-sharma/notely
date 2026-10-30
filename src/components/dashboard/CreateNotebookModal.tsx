import React, { useState } from 'react';
import { X, Book, Sparkles, Check } from 'lucide-react';
import { COVER_OPTIONS, CATEGORY_PRESETS, type PaperStyle } from '../../types';
import { useNotebookStore } from '../../stores/notebookStore';

interface CreateNotebookModalProps {
  onClose: () => void;
  onCreated: (id: string) => void;
}

const PAPER_STYLES: Array<{ id: PaperStyle; label: string; desc: string }> = [
  { id: 'ruled', label: 'Ruled Paper', desc: 'Classic ruled lines with margin' },
  { id: 'grid', label: 'Grid / Graph', desc: 'Engineering & structured layout' },
  { id: 'dotted', label: 'Dot Grid', desc: 'Bullet journal & sketch friendly' },
  { id: 'plain', label: 'Plain Sheet', desc: 'Clean unlined blank parchment' },
];

export default function CreateNotebookModal({ onClose, onCreated }: CreateNotebookModalProps) {
  const createNotebook = useNotebookStore(s => s.createNotebook);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORY_PRESETS[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [paperStyle, setPaperStyle] = useState<PaperStyle>('ruled');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(COVER_OPTIONS[0].color);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const finalCategory = customCategory.trim() || category;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a title for your notebook');
      return;
    }
    setIsCreating(true);
    try {
      const notebook = await createNotebook({
        title: title.trim(),
        category: finalCategory,
        subject: finalCategory,
        description: description.trim(),
        coverColor: selectedColor,
        coverPattern: 'solid',
        paperStyle,
      });
      onCreated(notebook.id);
    } catch (err) {
      setError('Failed to create notebook. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 animate-pop-in overflow-hidden border border-gray-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with preview accent */}
        <div className="relative px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-stone-50 to-amber-50/40">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm"
              style={{ background: selectedColor }}
            >
              <Book size={16} />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg leading-tight">Create New Notebook</h2>
              <p className="text-xs text-gray-500">Craft a tactile journal, notebook, or planner</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-200/60 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Cover Color Selection */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Cover Leather & Color
            </label>
            <div className="grid grid-cols-6 sm:grid-cols-6 gap-2.5">
              {COVER_OPTIONS.map(opt => (
                <button
                  key={opt.color}
                  type="button"
                  onClick={() => setSelectedColor(opt.color)}
                  className={`h-9 rounded-xl transition-all relative flex items-center justify-center shadow-sm ${
                    selectedColor === opt.color
                      ? 'ring-2 ring-offset-2 ring-gray-900 scale-105'
                      : 'hover:scale-105 opacity-90 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: opt.color }}
                  title={opt.label}
                >
                  {selectedColor === opt.color && (
                    <Check size={14} className="text-white drop-shadow-md stroke-[3]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Notebook Title <span className="text-amber-600">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => { setTitle(e.target.value); setError(''); }}
              placeholder="e.g. Product Strategy, Daily Journal, Engineering Log..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm font-medium transition-all"
              autoFocus
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>

          {/* Category / Topic */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Category / Topic
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {CATEGORY_PRESETS.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => { setCategory(cat); setCustomCategory(''); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    category === cat && !customCategory
                      ? 'bg-stone-900 text-white shadow-sm'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={customCategory}
              onChange={e => setCustomCategory(e.target.value)}
              placeholder="Or write a custom category..."
              className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-700 outline-none focus:border-blue-500"
            />
          </div>

          {/* Paper Style */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Interior Paper Style
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PAPER_STYLES.map(style => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setPaperStyle(style.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-0.5 ${
                    paperStyle === style.id
                      ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <span className="text-xs font-bold text-gray-800">{style.label}</span>
                  <span className="text-[11px] text-gray-500 leading-tight">{style.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Subtitle or Purpose (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Brainstorms, reflections, architecture notes"
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-xs text-gray-700 transition-all"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="flex-1 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 transition-colors disabled:opacity-60 shadow-md shadow-stone-900/10"
            >
              {isCreating ? 'Creating…' : 'Create Notebook'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
