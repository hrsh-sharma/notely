import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Notebook, Page, SaveStatus, ViewMode, PaperStyle } from '../types';
import * as db from '../services/db';
import { generateId } from '../utils/uuid';
import {
  syncFromCloud,
  cloudSaveNotebook,
  cloudDeleteNotebook,
  cloudSavePage,
  cloudDeletePage,
} from '../services/cloudSync';

interface NotebookStore {
  // Dashboard state
  notebooks: Notebook[];
  isLoadingNotebooks: boolean;

  // Editor state
  activeNotebook: Notebook | null;
  pages: Page[];
  currentPageIndex: number; // 0-based
  saveStatus: SaveStatus;
  viewMode: ViewMode;
  isSidebarOpen: boolean;
  searchQuery: string;
  searchResults: Page[];

  // Dashboard actions
  loadNotebooks: () => Promise<void>;
  createNotebook: (data: Partial<Notebook>) => Promise<Notebook>;
  updateNotebook: (id: string, data: Partial<Notebook>) => Promise<void>;
  deleteNotebook: (id: string) => Promise<void>;
  togglePinNotebook: (id: string) => Promise<void>;
  openNotebook: (id: string) => Promise<void>;
  closeNotebook: () => void;

  // Page actions
  loadPages: (notebookId: string) => Promise<void>;
  setCurrentPage: (index: number) => void;
  savePage: (pageId: string, content: string) => Promise<void>;
  addPage: (afterIndex?: number) => Promise<void>;
  deletePage: (pageId: string) => Promise<void>;
  duplicatePage: (pageId: string) => Promise<void>;
  reorderPages: (pageIds: string[]) => Promise<void>;
  updatePageDate: (pageId: string, date: string) => Promise<void>;

  // UI actions
  setSaveStatus: (status: SaveStatus) => void;
  setViewMode: (mode: ViewMode) => void;
  setPaperStyle: (style: PaperStyle) => Promise<void>;
  toggleSidebar: () => void;
  setSearchQuery: (query: string) => void;
  searchPages: (query: string) => Promise<void>;
}

export const useNotebookStore = create<NotebookStore>()(
  subscribeWithSelector((set, get) => ({
    notebooks: [],
    isLoadingNotebooks: false,
    activeNotebook: null,
    pages: [],
    currentPageIndex: 0,
    saveStatus: 'saved',
    viewMode: 'spread',
    isSidebarOpen: true,
    searchQuery: '',
    searchResults: [],

    loadNotebooks: async () => {
      set({ isLoadingNotebooks: true });
      try {
        await syncFromCloud();
        const notebooks = await db.getAllNotebooks();
        set({ notebooks, isLoadingNotebooks: false });
      } catch (error) {
        console.error('Failed to load notebooks:', error);
        set({ isLoadingNotebooks: false });
      }
    },

    createNotebook: async (data) => {
      const now = Date.now();
      const notebook: Notebook = {
        id: generateId(),
        title: data.title || 'Untitled Notebook',
        category: data.category || data.subject || 'General',
        subject: data.category || data.subject || 'General',
        coverColor: data.coverColor || '#E85D26',
        coverPattern: data.coverPattern || 'solid',
        paperStyle: data.paperStyle || 'ruled',
        pageCount: 1,
        createdAt: now,
        updatedAt: now,
        description: data.description || '',
        isLocked: data.isLocked ?? false,
        pinCode: data.pinCode || undefined,
        isPinned: data.isPinned ?? false,
      };
      await db.saveNotebook(notebook);

      // Create first page
      const firstPage: Page = {
        id: generateId(),
        notebookId: notebook.id,
        pageNumber: 1,
        content: JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] }),
        date: new Date(now).toLocaleDateString('en-US', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        }),
        createdAt: now,
        updatedAt: now,
      };
      await db.savePage(firstPage);

      // Cloud sync (awaited so we catch errors)
      await cloudSaveNotebook(notebook);
      await cloudSavePage(firstPage);

      const notebooks = await db.getAllNotebooks();
      set({ notebooks });
      return notebook;
    },

    updateNotebook: async (id, data) => {
      const notebook = await db.getNotebook(id);
      if (!notebook) return;
      const updated = { ...notebook, ...data, updatedAt: Date.now() };
      await db.saveNotebook(updated);
      cloudSaveNotebook(updated);

      const notebooks = await db.getAllNotebooks();
      set({ notebooks });
      if (get().activeNotebook?.id === id) {
        set({ activeNotebook: updated });
      }
    },

    deleteNotebook: async (id) => {
      await db.deleteNotebook(id);
      cloudDeleteNotebook(id);
      const notebooks = await db.getAllNotebooks();
      set({ notebooks });
    },

    togglePinNotebook: async (id) => {
      const notebook = await db.getNotebook(id);
      if (!notebook) return;
      const nextPinned = !notebook.isPinned;
      const updated = { ...notebook, isPinned: nextPinned, updatedAt: Date.now() };
      if (typeof window !== 'undefined') {
        if (nextPinned) {
          localStorage.setItem(`notely_pinned_${id}`, 'true');
        } else {
          localStorage.removeItem(`notely_pinned_${id}`);
        }
      }
      await db.saveNotebook(updated);
      cloudSaveNotebook(updated);

      const notebooks = await db.getAllNotebooks();
      set({ notebooks });
      if (get().activeNotebook?.id === id) {
        set({ activeNotebook: updated });
      }
    },

    openNotebook: async (id) => {
      const notebook = await db.getNotebook(id);
      if (!notebook) return;
      set({ activeNotebook: notebook });
      await get().loadPages(id);
    },

    closeNotebook: () => {
      set({ activeNotebook: null, pages: [], currentPageIndex: 0, searchQuery: '', searchResults: [] });
    },

    loadPages: async (notebookId) => {
      let pages = await db.getPagesForNotebook(notebookId);
      if (pages.length === 0) {
        // Create first page if none exist
        const now = Date.now();
        const firstPage: Page = {
          id: generateId(),
          notebookId,
          pageNumber: 1,
          content: JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] }),
          date: new Date(now).toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          }),
          createdAt: now,
          updatedAt: now,
        };
        await db.savePage(firstPage);
        pages = [firstPage];
      }
      set({ pages, currentPageIndex: 0 });
    },

    setCurrentPage: (index) => {
      const { pages } = get();
      const clamped = Math.max(0, Math.min(index, pages.length - 1));
      set({ currentPageIndex: clamped });
    },

    savePage: async (pageId, content) => {
      const { pages, activeNotebook } = get();
      const page = pages.find(p => p.id === pageId);
      if (!page) return;

      set({ saveStatus: 'saving' });
      try {
        const updated: Page = { ...page, content, updatedAt: Date.now() };
        await db.savePage(updated);
        cloudSavePage(updated);

        set(state => ({
          pages: state.pages.map(p => p.id === pageId ? updated : p),
          saveStatus: 'saved',
        }));

        // Update notebook's updatedAt
        if (activeNotebook) {
          const updatedNotebook = { ...activeNotebook, updatedAt: Date.now() };
          await db.saveNotebook(updatedNotebook);
          cloudSaveNotebook(updatedNotebook);
          set({ activeNotebook: updatedNotebook });
        }
      } catch (error) {
        console.error('Failed to save page:', error);
        set({ saveStatus: 'error' });
      }
    },

    addPage: async (afterIndex) => {
      const { pages, activeNotebook, currentPageIndex } = get();
      if (!activeNotebook) return;

      const insertAfter = afterIndex !== undefined ? afterIndex : currentPageIndex;
      const now = Date.now();
      const newPageNumber = insertAfter + 2; // Will be renumbered

      const newPage: Page = {
        id: generateId(),
        notebookId: activeNotebook.id,
        pageNumber: newPageNumber,
        content: JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] }),
        date: new Date(now).toLocaleDateString('en-US', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        }),
        createdAt: now,
        updatedAt: now,
      };

      // Insert and renumber
      const newPages = [
        ...pages.slice(0, insertAfter + 1),
        newPage,
        ...pages.slice(insertAfter + 1),
      ].map((p, i) => ({ ...p, pageNumber: i + 1 }));

      for (const p of newPages) {
        await db.savePage(p);
      }

      // Update notebook page count
      const updatedNotebook = { ...activeNotebook, pageCount: newPages.length, updatedAt: now };
      await db.saveNotebook(updatedNotebook);

      set({
        pages: newPages,
        activeNotebook: updatedNotebook,
        currentPageIndex: insertAfter + 1,
      });
    },

    deletePage: async (pageId) => {
      const { pages, activeNotebook, currentPageIndex } = get();
      if (pages.length <= 1) return; // Don't delete last page
      if (!activeNotebook) return;

      const newPages = pages.filter(p => p.id !== pageId).map((p, i) => ({ ...p, pageNumber: i + 1 }));

      await db.deletePage(pageId);
      cloudDeletePage(pageId);
      for (const p of newPages) {
        await db.savePage(p);
      }

      const updatedNotebook = { ...activeNotebook, pageCount: newPages.length, updatedAt: Date.now() };
      await db.saveNotebook(updatedNotebook);

      set({
        pages: newPages,
        activeNotebook: updatedNotebook,
        currentPageIndex: Math.min(currentPageIndex, newPages.length - 1),
      });
    },

    duplicatePage: async (pageId) => {
      const { pages, activeNotebook } = get();
      if (!activeNotebook) return;

      const pageIndex = pages.findIndex(p => p.id === pageId);
      if (pageIndex === -1) return;

      const original = pages[pageIndex];
      const now = Date.now();
      const duplicate: Page = {
        ...original,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };

      const newPages = [
        ...pages.slice(0, pageIndex + 1),
        duplicate,
        ...pages.slice(pageIndex + 1),
      ].map((p, i) => ({ ...p, pageNumber: i + 1 }));

      for (const p of newPages) {
        await db.savePage(p);
      }

      const updatedNotebook = { ...activeNotebook, pageCount: newPages.length, updatedAt: now };
      await db.saveNotebook(updatedNotebook);

      set({
        pages: newPages,
        activeNotebook: updatedNotebook,
        currentPageIndex: pageIndex + 1,
      });
    },

    reorderPages: async (pageIds) => {
      const { pages, activeNotebook } = get();
      if (!activeNotebook) return;

      const pageMap = new Map(pages.map(p => [p.id, p]));
      const newPages = pageIds
        .map((id, i) => {
          const page = pageMap.get(id);
          if (!page) return null;
          return { ...page, pageNumber: i + 1 };
        })
        .filter(Boolean) as Page[];

      for (const p of newPages) {
        await db.savePage(p);
      }

      set({ pages: newPages });
    },

    updatePageDate: async (pageId, date) => {
      const { pages } = get();
      const page = pages.find(p => p.id === pageId);
      if (!page) return;
      const updated = { ...page, date, updatedAt: Date.now() };
      await db.savePage(updated);
      set(state => ({
        pages: state.pages.map(p => p.id === pageId ? updated : p),
      }));
    },

    setSaveStatus: (status) => set({ saveStatus: status }),
    setViewMode: (mode) => set({ viewMode: mode }),
    setPaperStyle: async (style) => {
      const { activeNotebook } = get();
      if (!activeNotebook) return;
      const updated = { ...activeNotebook, paperStyle: style, updatedAt: Date.now() };
      await db.saveNotebook(updated);
      const notebooks = await db.getAllNotebooks();
      set({ activeNotebook: updated, notebooks });
    },
    toggleSidebar: () => set(state => ({ isSidebarOpen: !state.isSidebarOpen })),

    setSearchQuery: (query) => set({ searchQuery: query }),

    searchPages: async (query) => {
      const { activeNotebook } = get();
      if (!activeNotebook || !query.trim()) {
        set({ searchResults: [] });
        return;
      }
      const results = await db.searchPagesInNotebook(activeNotebook.id, query);
      set({ searchResults: results });
    },
  }))
);
