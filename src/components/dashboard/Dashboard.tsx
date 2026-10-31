import React, { useEffect, useState, useMemo } from 'react';
import { Plus, BookOpen, Pencil, Trash2, Search, ArrowUpDown, LogIn, X, Pin, Sparkles } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useNotebookStore } from '../../stores/notebookStore';
import { useAuthStore } from '../../stores/authStore';
import { useProfileStore } from '../../stores/profileStore';
import NotebookCard from './NotebookCard';
import CreateNotebookModal from './CreateNotebookModal';
import EditNotebookModal from './EditNotebookModal';
import LandingShowcase from './LandingShowcase';
import AuthModal from '../auth/AuthModal';
import ProfileDropdown from '../common/ProfileDropdown';
import ProfileModal from '../common/ProfileModal';
import PinUnlockModal from '../common/PinUnlockModal';
import AIDashboardModal from './AIDashboardModal';
import notelyLogo from '../../assets/Notely.png';
import type { Notebook } from '../../types';

interface DashboardProps {
  onOpenNotebook: (id: string) => void;
}

type SortOption = 'recent' | 'title' | 'pages';

export default function Dashboard({ onOpenNotebook }: DashboardProps) {
  const { notebooks, isLoadingNotebooks, loadNotebooks, deleteNotebook, openNotebook, togglePinNotebook } = useNotebookStore(
    useShallow(s => ({
      notebooks: s.notebooks,
      isLoadingNotebooks: s.isLoadingNotebooks,
      loadNotebooks: s.loadNotebooks,
      deleteNotebook: s.deleteNotebook,
      openNotebook: s.openNotebook,
      togglePinNotebook: s.togglePinNotebook,
    }))
  );

  const [showCreate, setShowCreate] = useState(false);
  const [editingNotebook, setEditingNotebook] = useState<Notebook | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [unlockingNotebook, setUnlockingNotebook] = useState<Notebook | null>(null);
  const [unlockAction, setUnlockAction] = useState<'open' | 'edit' | 'delete'>('open');
  const [showAIModal, setShowAIModal] = useState(false);

  const { user, signOut } = useAuthStore();
  const { profile } = useProfileStore();
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    loadNotebooks();
  }, [loadNotebooks]);

  // Ensure locked notebooks can never be deleted without PIN authentication
  useEffect(() => {
    if (deletingId) {
      const target = notebooks.find(n => n.id === deletingId);
      if (target && isNotebookLocked(target)) {
        setDeletingId(null);
        handleDeleteClick(target);
      }
    }
  }, [deletingId, notebooks]);

  // Extract all categories dynamically, adding 'Pinned' option if any pinned exist
  const categories = useMemo(() => {
    const set = new Set<string>();
    notebooks.forEach(n => {
      const cat = n.category || n.subject;
      if (cat) set.add(cat);
    });
    const hasAnyPinned = notebooks.some(n => n.isPinned);
    const baseList = ['All'];
    if (hasAnyPinned) {
      baseList.push('Pinned');
    }
    return [...baseList, ...Array.from(set)];
  }, [notebooks]);

  // Filter & Sort notebooks (Pinned notebooks always appear first: ORDER BY is_pinned DESC, updated_at DESC)
  const processedNotebooks = useMemo(() => {
    let list = notebooks.filter(n => {
      const titleMatch = n.title.toLowerCase().includes(searchQuery.toLowerCase());
      const catMatch = (n.category || n.subject || '').toLowerCase().includes(searchQuery.toLowerCase());
      const descMatch = (n.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSearch = titleMatch || catMatch || descMatch;

      if (!matchesSearch) return false;
      if (selectedCategory === 'Pinned') {
        return Boolean(n.isPinned);
      }
      if (selectedCategory !== 'All') {
        return (n.category || n.subject) === selectedCategory;
      }
      return true;
    });

    return list.sort((a, b) => {
      // Pinned notebooks always appear before unpinned notebooks
      const aPinned = a.isPinned ? 1 : 0;
      const bPinned = b.isPinned ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned;

      if (sortBy === 'recent') return b.updatedAt - a.updatedAt;
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'pages') return b.pageCount - a.pageCount;
      return 0;
    });
  }, [notebooks, searchQuery, selectedCategory, sortBy]);

  const getNotebookPin = (n: Notebook): string | null => {
    return n.pinCode || (typeof window !== 'undefined' ? localStorage.getItem(`notely_pin_${n.id}`) : null) || null;
  };

  const isNotebookLocked = (n: Notebook): boolean => {
    const pin = getNotebookPin(n);
    return Boolean(n.isLocked || (pin && pin.length === 4));
  };

  const handleOpen = async (notebook: Notebook) => {
    if (isNotebookLocked(notebook)) {
      const pin = getNotebookPin(notebook);
      setUnlockingNotebook({
        ...notebook,
        isLocked: true,
        pinCode: pin || notebook.pinCode,
      });
      setUnlockAction('open');
      return;
    }
    await openNotebook(notebook.id);
    onOpenNotebook(notebook.id);
  };

  const handleEditClick = (notebook: Notebook) => {
    setEditingNotebook(notebook);
  };

  const handleDeleteClick = (notebook: Notebook) => {
    if (isNotebookLocked(notebook)) {
      const pin = getNotebookPin(notebook);
      setUnlockingNotebook({
        ...notebook,
        isLocked: true,
        pinCode: pin || notebook.pinCode,
      });
      setUnlockAction('delete');
      return;
    }
    setDeletingId(notebook.id);
  };

  const handleUnlockSuccess = async () => {
    if (!unlockingNotebook) return;
    const target = unlockingNotebook;
    const action = unlockAction;
    setUnlockingNotebook(null);

    if (action === 'open') {
      await openNotebook(target.id);
      onOpenNotebook(target.id);
    } else if (action === 'edit') {
      setEditingNotebook(target);
    } else if (action === 'delete') {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`notely_pin_${target.id}`);
      }
      await deleteNotebook(target.id);
    }
  };

  const handleCreated = async (id: string, wasLocked?: boolean) => {
    setShowCreate(false);
    if (wasLocked) {
      const created = useNotebookStore.getState().notebooks.find(n => n.id === id);
      if (created && isNotebookLocked(created)) {
        const pin = getNotebookPin(created);
        setUnlockingNotebook({
          ...created,
          isLocked: true,
          pinCode: pin || created.pinCode,
        });
        setUnlockAction('open');
        return;
      }
    }
    await openNotebook(id);
    onOpenNotebook(id);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`notely_pin_${deletingId}`);
    }
    await deleteNotebook(deletingId);
    setDeletingId(null);
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-stone-900 pb-16">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-[#FBF9F5]/90 backdrop-blur-md border-b border-stone-200/80 shadow-xs transition-all">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <img src={notelyLogo} alt="Notely" className="w-9 h-9 object-contain drop-shadow-xs" />
            <div>
              <h1 className="text-lg font-black tracking-tight text-stone-900 leading-none" style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}>
                Notely
              </h1>
              <p className="text-[10px] text-stone-400 font-semibold leading-none mt-1 tracking-wider uppercase">
                Your digital notebook
              </p>
            </div>
          </div>

          {/* Search Input - Only shown when logged in */}
          {user && (
            <div className="relative flex-1 max-w-sm hidden sm:block">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search notebooks…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-stone-200 bg-white/90 focus:bg-white focus:border-stone-800 focus:ring-2 focus:ring-stone-200 outline-none transition-all shadow-xs text-stone-800"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5">
            {user ? (
              <>
                <ProfileDropdown
                  user={user}
                  profile={profile}
                  onSignOut={signOut}
                  onOpenProfile={() => setShowProfileModal(true)}
                />

                {/* AI Notes CTA */}
                <button
                  onClick={() => setShowAIModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-sm transition-all hover:shadow hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Sparkles size={14} className="text-violet-200" />
                  <span>AI Notes</span>
                </button>

                {/* New Notebook CTA */}
                <button
                  onClick={() => setShowCreate(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-200 text-xs font-semibold shadow-sm transition-all hover:shadow hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Plus size={15} />
                  <span>New Notebook</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-stone-300/80 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold shadow-sm transition-all hover:shadow"
              >
                <LogIn size={14} className="text-stone-500" />
                <span>Sign In / Register</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-6 pt-7">
        {!user ? (
          <LandingShowcase onSignIn={() => setShowAuthModal(true)} />
        ) : (
          <>
            {/* Filter & Sort Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7 pb-4 border-b border-stone-200/70">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-stone-900 text-white shadow-xs font-semibold'
                        : 'bg-white/80 hover:bg-white text-stone-600 hover:text-stone-900 border border-stone-200/80'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Sort Controls & Count */}
              <div className="flex items-center gap-3 self-end sm:self-auto flex-shrink-0 text-xs">
                <span className="text-stone-400 font-medium">
                  {processedNotebooks.length} {processedNotebooks.length === 1 ? 'notebook' : 'notebooks'}
                </span>
                <div className="h-3 w-px bg-stone-300/70" />
                <div className="flex items-center gap-1.5 bg-white/90 border border-stone-200/90 rounded-xl px-2.5 py-1.5 shadow-xs">
                  <ArrowUpDown size={12} className="text-stone-400" />
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as SortOption)}
                    className="bg-transparent font-medium text-stone-700 outline-none cursor-pointer text-xs"
                  >
                    <option value="recent">Recently updated</option>
                    <option value="title">Title (A-Z)</option>
                    <option value="pages">Most pages</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notebooks Grid or Empty States */}
            {isLoadingNotebooks ? (
              <div className="flex items-center justify-center py-28">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-stone-200 flex items-center justify-center animate-pulse">
                    <BookOpen size={24} className="text-stone-400" />
                  </div>
                  <p className="text-sm font-medium text-stone-500">Opening notebook library…</p>
                </div>
              </div>
            ) : processedNotebooks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white/60 rounded-3xl border border-stone-200/70 p-12 text-center max-w-md mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-amber-100/70 text-amber-700 flex items-center justify-center">
                  <BookOpen size={28} />
                </div>
                <div>
                  <h3 className="font-bold text-stone-800 text-base">
                    {searchQuery || selectedCategory !== 'All' ? 'No matching notebooks' : 'Your library is empty'}
                  </h3>
                  <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                    {searchQuery || selectedCategory !== 'All'
                      ? 'Try clearing your search query or switching categories.'
                      : 'Create your first digital notebook to begin writing, journaling, and sketching ideas.'}
                  </p>
                </div>
                <button
                  onClick={() => setShowCreate(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 text-amber-200 text-xs font-semibold shadow hover:bg-stone-800 transition-colors"
                >
                  <Plus size={15} />
                  <span>Create Notebook</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-7">
                {processedNotebooks.map(notebook => (
                  <div
                    key={notebook.id}
                    className="relative group"
                    onMouseEnter={() => setHoveredId(notebook.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <NotebookCard notebook={notebook} onClick={() => handleOpen(notebook)} />

                    {/* Floating Quick Actions */}
                    <div
                      className={`absolute top-2.5 right-2.5 flex items-center gap-1.5 z-30 transition-all duration-200 ${
                        hoveredId === notebook.id ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none'
                      }`}
                    >
                      {/* Pin Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePinNotebook(notebook.id);
                        }}
                        className={`p-1.5 backdrop-blur-md rounded-lg shadow-md transition-all hover:scale-105 ${
                          notebook.isPinned
                            ? 'bg-amber-400 text-stone-900 hover:bg-amber-300'
                            : 'bg-white/95 hover:bg-white text-stone-600 hover:text-amber-600'
                        }`}
                        title={notebook.isPinned ? 'Unpin notebook' : 'Pin notebook to top'}
                      >
                        <Pin size={12} className={notebook.isPinned ? 'fill-stone-900' : ''} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(notebook);
                        }}
                        className="p-1.5 bg-white/95 hover:bg-white text-stone-600 hover:text-stone-950 backdrop-blur-md rounded-lg shadow-md transition-all hover:scale-105"
                        title="Edit notebook"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(notebook);
                        }}
                        className="p-1.5 bg-white/95 hover:bg-red-50 text-stone-600 hover:text-red-600 backdrop-blur-md rounded-lg shadow-md transition-all hover:scale-105"
                        title="Delete notebook"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Quick "New Notebook" Slot Card */}
                <div
                  onClick={() => setShowCreate(true)}
                  className="group cursor-pointer rounded-2xl border-2 border-dashed border-stone-300 hover:border-stone-400 bg-white/40 hover:bg-white/80 transition-all duration-300 flex flex-col items-center justify-center gap-3 p-6 text-stone-400 hover:text-stone-800 shadow-xs hover:shadow-md hover:-translate-y-1.5 select-none"
                  style={{ aspectRatio: '3 / 4' }}
                  title="Add a new notebook"
                >
                  <div className="w-12 h-12 rounded-2xl bg-stone-100 group-hover:bg-stone-900 group-hover:text-amber-200 text-stone-600 shadow-xs flex items-center justify-center transition-all duration-200 group-hover:scale-105">
                    <Plus size={22} />
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-bold text-stone-700 group-hover:text-stone-900 block">
                      New Notebook
                    </span>
                    <span className="text-[11px] text-stone-400 block mt-0.5">
                      Start a blank journal
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Modals */}
      {showCreate && (
        <CreateNotebookModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}

      {editingNotebook && (
        <EditNotebookModal
          notebook={editingNotebook}
          onClose={() => setEditingNotebook(null)}
        />
      )}

      {/* Profile Modal */}
      {showProfileModal && user && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {/* PIN Unlock Modal */}
      {unlockingNotebook && (
        <PinUnlockModal
          notebook={unlockingNotebook}
          titleAction={unlockAction}
          onClose={() => setUnlockingNotebook(null)}
          onSuccess={handleUnlockSuccess}
        />
      )}

      {/* Supabase Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* AI Dashboard Modal */}
      {showAIModal && (
        <AIDashboardModal
          onClose={() => setShowAIModal(false)}
          onNotebookCreated={(id) => onOpenNotebook(id)}
        />
      )}

      {/* Delete Confirmation */}
      {deletingId && (
        <div className="modal-backdrop" onClick={() => setDeletingId(null)}>
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-sm mx-4 p-6 animate-pop-in border border-stone-100"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={22} />
              </div>
              <h3 className="font-bold text-stone-900 text-lg mb-1">Delete Notebook?</h3>
              <p className="text-xs text-stone-500 mb-6 leading-relaxed">
                This will permanently delete this notebook and all its handwritten pages. This cannot be undone.
              </p>
              <div className="flex gap-2.5">
                <button
                  onClick={() => setDeletingId(null)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-700 text-xs font-semibold hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors shadow-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
