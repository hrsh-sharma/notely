import React, { useEffect, useState, useMemo } from 'react';
import { Plus, BookOpen, Pencil, Trash2, Search, ArrowUpDown, LogIn } from 'lucide-react';
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
import notelyLogo from '../../assets/Notely.png';
import type { Notebook } from '../../types';

interface DashboardProps {
  onOpenNotebook: (id: string) => void;
}

type SortOption = 'recent' | 'title' | 'pages';

export default function Dashboard({ onOpenNotebook }: DashboardProps) {
  const { notebooks, isLoadingNotebooks, loadNotebooks, deleteNotebook, openNotebook } = useNotebookStore(
    useShallow(s => ({
      notebooks: s.notebooks,
      isLoadingNotebooks: s.isLoadingNotebooks,
      loadNotebooks: s.loadNotebooks,
      deleteNotebook: s.deleteNotebook,
      openNotebook: s.openNotebook,
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

  const { user, signOut } = useAuthStore();
  const { profile } = useProfileStore();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileModalMode, setProfileModalMode] = useState<'profile' | 'settings'>('profile');

  useEffect(() => {
    loadNotebooks();
  }, [loadNotebooks]);

  // Extract all categories dynamically
  const categories = useMemo(() => {
    const set = new Set<string>();
    notebooks.forEach(n => {
      const cat = n.category || n.subject;
      if (cat) set.add(cat);
    });
    return ['All', ...Array.from(set)];
  }, [notebooks]);

  // Filter & Sort notebooks
  const processedNotebooks = useMemo(() => {
    let list = notebooks.filter(n => {
      const titleMatch = n.title.toLowerCase().includes(searchQuery.toLowerCase());
      const catMatch = (n.category || n.subject || '').toLowerCase().includes(searchQuery.toLowerCase());
      const descMatch = (n.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSearch = titleMatch || catMatch || descMatch;

      if (!matchesSearch) return false;
      if (selectedCategory !== 'All') {
        return (n.category || n.subject) === selectedCategory;
      }
      return true;
    });

    return list.sort((a, b) => {
      if (sortBy === 'recent') return b.updatedAt - a.updatedAt;
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'pages') return b.pageCount - a.pageCount;
      return 0;
    });
  }, [notebooks, searchQuery, selectedCategory, sortBy]);

  const handleOpen = async (id: string) => {
    await openNotebook(id);
    onOpenNotebook(id);
  };

  const handleCreateClick = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setShowCreate(true);
  };

  const handleCreated = async (id: string) => {
    setShowCreate(false);
    await openNotebook(id);
    onOpenNotebook(id);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    await deleteNotebook(deletingId);
    setDeletingId(null);
  };

  return (
    <div className="min-h-screen bg-[#F5F1E9] text-stone-900 pb-16">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-[#F5F1E9]/90 backdrop-blur-md border-b border-stone-300/60 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <img src={notelyLogo} alt="Notely" className="w-10 h-10 object-contain drop-shadow-sm" />
            <div>
              <h1 className="text-xl font-black tracking-tight text-stone-900 leading-none" style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}>
                Notely
              </h1>
              <p className="text-[10px] text-stone-400 font-semibold leading-none mt-0.5 tracking-wide uppercase">
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
                placeholder="Search by title, tag, or notes…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-stone-300/80 bg-white/80 focus:bg-white focus:border-stone-800 focus:ring-2 focus:ring-stone-200 outline-none transition-all shadow-inner"
              />
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
                  onOpenProfile={() => { setProfileModalMode('profile'); setShowProfileModal(true); }}
                  onOpenSettings={() => { setProfileModalMode('settings'); setShowProfileModal(true); }}
                />

                {/* New Notebook CTA - Only shown when logged in */}
                <button
                  onClick={() => setShowCreate(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-200 text-xs font-semibold shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Plus size={16} />
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

        {/* Categories & Filter Bar - Only shown when logged in */}
        {user && (
          <div className="max-w-7xl mx-auto px-6 py-2.5 flex items-center justify-between gap-4 border-t border-stone-200/50 overflow-x-auto">
            {/* Category Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-stone-900 text-white shadow-sm'
                      : 'bg-stone-200/70 text-stone-600 hover:bg-stone-300/70'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Sort Controls */}
            <div className="flex items-center gap-1.5 flex-shrink-0 text-xs text-stone-500">
              <ArrowUpDown size={13} className="text-stone-400" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortOption)}
                className="bg-transparent font-medium text-stone-700 outline-none cursor-pointer"
              >
                <option value="recent">Recently updated</option>
                <option value="title">Title (A-Z)</option>
                <option value="pages">Most pages</option>
              </select>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className={user ? "max-w-7xl mx-auto px-6 pt-12" : "max-w-7xl mx-auto px-4 pt-4"}>
        {!user ? (
          <LandingShowcase onSignIn={() => setShowAuthModal(true)} />
        ) : isLoadingNotebooks ? (
          <div className="flex items-center justify-center py-28">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-stone-200 flex items-center justify-center animate-pulse">
                <BookOpen size={24} className="text-stone-400" />
              </div>
              <p className="text-sm font-medium text-stone-500">Opening notebook library…</p>
            </div>
          </div>
        ) : processedNotebooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white/50 rounded-3xl border border-stone-200/70 p-12 text-center max-w-md mx-auto">
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {processedNotebooks.map(notebook => (
              <div
                key={notebook.id}
                className="relative group"
                onMouseEnter={() => setHoveredId(notebook.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <NotebookCard notebook={notebook} onClick={() => handleOpen(notebook.id)} />

                {/* Floating Quick Actions */}
                <div
                  className={`absolute top-2 right-2 flex gap-1 z-30 transition-all duration-200 ${
                    hoveredId === notebook.id ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none'
                  }`}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingNotebook(notebook);
                    }}
                    className="p-1.5 bg-white/95 backdrop-blur-sm rounded-lg shadow-md text-stone-600 hover:text-blue-600 transition-colors"
                    title="Edit notebook"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingId(notebook.id);
                    }}
                    className="p-1.5 bg-white/95 backdrop-blur-sm rounded-lg shadow-md text-stone-600 hover:text-red-600 transition-colors"
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
              className="group cursor-pointer rounded-2xl border-2 border-dashed border-stone-300 hover:border-stone-500 hover:bg-stone-200/40 transition-all duration-300 flex flex-col items-center justify-center gap-2.5 text-stone-400 hover:text-stone-700"
              style={{ aspectRatio: '3 / 4' }}
              title="Add a new notebook"
            >
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center transition-transform group-hover:scale-110">
                <Plus size={20} className="text-stone-600" />
              </div>
              <span className="text-xs font-semibold text-center px-3">
                New Notebook
              </span>
            </div>
          </div>
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
          mode={profileModalMode}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {/* Supabase Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

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
