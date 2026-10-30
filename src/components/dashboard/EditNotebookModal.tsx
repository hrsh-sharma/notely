import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { COVER_OPTIONS as COVERS, CATEGORY_PRESETS, type Notebook, type PaperStyle } from '../../types';
import { useNotebookStore } from '../../stores/notebookStore';

interface EditNotebookModalProps {
  notebook: Notebook;
  onClose: () => void;
}

export default function EditNotebookModal({ notebook, onClose }: EditNotebookModalProps) {
  const updateNotebook = useNotebookStore(s => s.updateNotebook);
  const [title, setTitle] = useState(notebook.title);
  const [category, setCategory] = useState(notebook.category || notebook.subject || 'General');
  const [description, setDescription] = useState(notebook.description || '');
  const [selectedColor, setSelectedColor] = useState(notebook.coverColor);
  const [paperStyle, setPaperStyle] = useState<PaperStyle>(notebook.paperStyle || 'ruled');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSaving(true);
    await updateNotebook(notebook.id, {
      title: title.trim(),
      category: category.trim(),
      subject: category.trim(),
      description: description.trim(),
      coverColor: selectedColor,
      paperStyle,
    });
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 animate-pop-in overflow-hidden border border-gray-100"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-stone-50/50">
          <h2 className="font-bold text-gray-800 text-lg">Edit Notebook</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-200/60 text-gray-400 hover:text-gray-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Cover Color</label>
            <div className="grid grid-cols-6 gap-2">
              {COVERS.map(opt => (
                <button
                  key={opt.color}
                  type="button"
                  onClick={() => setSelectedColor(opt.color)}
                  className={`h-8 rounded-lg transition-all relative flex items-center justify-center shadow-sm ${
                    selectedColor === opt.color
                      ? 'ring-2 ring-offset-2 ring-gray-900 scale-105'
                      : 'hover:scale-105 opacity-90'
                  }`}
                  style={{ backgroundColor: opt.color }}
                  title={opt.label}
                >
                  {selectedColor === opt.color && (
                    <Check size={13} className="text-white drop-shadow-md stroke-[3]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Notebook Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Category / Tag</label>
            <input
              type="text"
              value={category}
              onChange={e => setCategory(e.target.value)}
              placeholder="e.g. Work, Ideas, Journal..."
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-xs text-gray-700 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Description (optional)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-xs text-gray-700 transition-all resize-none"
            />
          </div>

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
              disabled={isSaving}
              className="flex-1 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 transition-colors disabled:opacity-60"
            >
              {isSaving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
