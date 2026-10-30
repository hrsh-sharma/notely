import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { Notebook, Page } from '../types';
import { generateId } from '../utils/uuid';

const DB_NAME = 'digital-notebook-db';
const DB_VERSION = 1;

interface NotebookDB extends DBSchema {
  notebooks: {
    key: string;
    value: Notebook;
    indexes: { 'by-updated': number };
  };
  pages: {
    key: string;
    value: Page;
    indexes: {
      'by-notebook': string;
      'by-notebook-page': [string, number];
    };
  };
}

let db: IDBPDatabase<NotebookDB> | null = null;

async function getDB(): Promise<IDBPDatabase<NotebookDB>> {
  if (!db) {
    db = await openDB<NotebookDB>(DB_NAME, DB_VERSION, {
      upgrade(database) {
        // Notebooks store
        if (!database.objectStoreNames.contains('notebooks')) {
          const notebookStore = database.createObjectStore('notebooks', { keyPath: 'id' });
          notebookStore.createIndex('by-updated', 'updatedAt');
        }

        // Pages store
        if (!database.objectStoreNames.contains('pages')) {
          const pageStore = database.createObjectStore('pages', { keyPath: 'id' });
          pageStore.createIndex('by-notebook', 'notebookId');
          pageStore.createIndex('by-notebook-page', ['notebookId', 'pageNumber']);
        }
      },
    });
  }
  return db;
}

// Notebook operations
export async function getAllNotebooks(): Promise<Notebook[]> {
  const database = await getDB();
  const notebooks = await database.getAll('notebooks');

  // Auto-migration: Deduplicate by title & remove old "Grade 11" tags
  const seenTitles = new Set<string>();
  const cleaned: Notebook[] = [];
  const toDelete: string[] = [];

  for (const n of notebooks) {
    if (seenTitles.has(n.title.toLowerCase().trim())) {
      toDelete.push(n.id);
      continue;
    }
    seenTitles.add(n.title.toLowerCase().trim());

    let modified = false;
    let cat = n.category || n.subject || 'General';
    if (cat.toLowerCase().includes('grade') || cat.toLowerCase().includes('semester')) {
      if (n.title.toLowerCase().includes('math')) cat = 'Mathematics & Logic';
      else if (n.title.toLowerCase().includes('physic')) cat = 'Physics & Science';
      else cat = 'General Notes';
      modified = true;
    }

    if (modified || !n.category) {
      n.category = cat;
      n.subject = cat;
      await database.put('notebooks', n);
    }
    cleaned.push(n);
  }

  // Remove duplicate entries
  for (const id of toDelete) {
    await database.delete('notebooks', id);
  }

  return cleaned.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function resetToFreshSamples(): Promise<void> {
  const database = await getDB();
  await database.clear('notebooks');
  await database.clear('pages');
  await seedSampleNotebooks();
}

export async function getNotebook(id: string): Promise<Notebook | undefined> {
  const database = await getDB();
  return database.get('notebooks', id);
}

export async function saveNotebook(notebook: Notebook): Promise<void> {
  const database = await getDB();
  await database.put('notebooks', notebook);
}

export async function deleteNotebook(id: string): Promise<void> {
  const database = await getDB();
  // Delete all pages first
  const pages = await getPagesForNotebook(id);
  const tx = database.transaction(['notebooks', 'pages'], 'readwrite');
  for (const page of pages) {
    await tx.objectStore('pages').delete(page.id);
  }
  await tx.objectStore('notebooks').delete(id);
  await tx.done;
}

// Page operations
export async function getPagesForNotebook(notebookId: string): Promise<Page[]> {
  const database = await getDB();
  const pages = await database.getAllFromIndex('pages', 'by-notebook', notebookId);
  return pages.sort((a, b) => a.pageNumber - b.pageNumber);
}

export async function getPage(id: string): Promise<Page | undefined> {
  const database = await getDB();
  return database.get('pages', id);
}

export async function savePage(page: Page): Promise<void> {
  const database = await getDB();
  await database.put('pages', page);
}

export async function deletePage(id: string): Promise<void> {
  const database = await getDB();
  await database.delete('pages', id);
}

export async function deleteAllPagesForNotebook(notebookId: string): Promise<void> {
  const database = await getDB();
  const pages = await getPagesForNotebook(notebookId);
  const tx = database.transaction('pages', 'readwrite');
  for (const page of pages) {
    await tx.store.delete(page.id);
  }
  await tx.done;
}

// Search pages within a notebook
export async function searchPagesInNotebook(notebookId: string, query: string): Promise<Page[]> {
  const pages = await getPagesForNotebook(notebookId);
  const lowerQuery = query.toLowerCase();
  return pages.filter(page => {
    try {
      const contentObj = JSON.parse(page.content);
      const text = extractTextFromContent(contentObj);
      return text.toLowerCase().includes(lowerQuery);
    } catch {
      return page.content.toLowerCase().includes(lowerQuery);
    }
  });
}

function extractTextFromContent(content: { content?: ContentNode[] }): string {
  if (!content || !content.content) return '';
  return content.content.map((node: ContentNode) => extractTextFromNode(node)).join(' ');
}

interface ContentNode {
  type?: string;
  text?: string;
  content?: ContentNode[];
}

function extractTextFromNode(node: ContentNode): string {
  if (node.type === 'text') return node.text || '';
  if (node.content) return node.content.map(extractTextFromNode).join(' ');
  return '';
}

// Helper to create a TipTap doc JSON
function createDoc(blocks: Array<{ type: string; attrs?: Record<string, any>; content?: any[] }>): string {
  return JSON.stringify({ type: 'doc', content: blocks });
}

// Seed initial sample notebooks
export async function seedSampleNotebooks(): Promise<void> {
  const existing = await getAllNotebooks();
  if (existing.length > 0) return;

  const now = Date.now();
  const sampleNotebooks: Array<{ notebook: Notebook; initialContent: string }> = [
    {
      notebook: {
        id: generateId(),
        title: 'Product & Architecture Log',
        category: 'Projects & Code',
        subject: 'Projects & Code',
        coverColor: '#1E3A5F',
        coverPattern: 'solid',
        paperStyle: 'ruled',
        pageCount: 1,
        createdAt: now - 86400000 * 3,
        updatedAt: now - 86400000 * 3,
        description: 'System design, engineering notes, and roadmap ideas',
      },
      initialContent: createDoc([
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'System Architecture & Next Steps' }],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Core objectives for the new distributed platform build:' },
          ],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [{
                type: 'paragraph',
                content: [
                  { type: 'text', marks: [{ type: 'bold' }], text: 'Offline-first persistence: ' },
                  { type: 'text', text: 'IndexedDB caching with seamless sync resilience.' },
                ],
              }],
            },
            {
              type: 'listItem',
              content: [{
                type: 'paragraph',
                content: [
                  { type: 'text', marks: [{ type: 'bold' }], text: 'Tactile UX: ' },
                  { type: 'text', text: 'Fluid typography, authentic ruled lines, and fast paper flips.' },
                ],
              }],
            },
            {
              type: 'listItem',
              content: [{
                type: 'paragraph',
                content: [
                  { type: 'text', marks: [{ type: 'bold' }], text: 'Performance budget: ' },
                  { type: 'text', text: 'Zero jank, sub-16ms frame times across interactions.' },
                ],
              }],
            },
          ],
        },
      ]),
    },
    {
      notebook: {
        id: generateId(),
        title: 'Daily Journal & Reflections',
        category: 'Daily Journal',
        subject: 'Daily Journal',
        coverColor: '#B45309',
        coverPattern: 'solid',
        paperStyle: 'ruled',
        pageCount: 1,
        createdAt: now - 86400000 * 2,
        updatedAt: now - 86400000 * 2,
        description: 'Morning thoughts, weekly reflections, and personal growth',
      },
      initialContent: createDoc([
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Morning Thoughts & Focus' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              marks: [{ type: 'italic' }],
              text: '"Simplicity is the prerequisite for reliability." — Edsger W. Dijkstra',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Today focuses on clarity of mind, deep uninterrupted work blocks, and sketching out new creative concepts.',
            },
          ],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [{
                type: 'paragraph',
                content: [{ type: 'text', text: 'Morning walk and reflection' }],
              }],
            },
            {
              type: 'listItem',
              content: [{
                type: 'paragraph',
                content: [{ type: 'text', text: 'Finish core notebook UI interactions' }],
              }],
            },
            {
              type: 'listItem',
              content: [{
                type: 'paragraph',
                content: [{ type: 'text', text: 'Read two chapters of design history' }],
              }],
            },
          ],
        },
      ]),
    },
    {
      notebook: {
        id: generateId(),
        title: 'Creative Ideas & Brainstorms',
        category: 'Ideas & Brainstorms',
        subject: 'Ideas & Brainstorms',
        coverColor: '#E85D26',
        coverPattern: 'solid',
        paperStyle: 'ruled',
        pageCount: 1,
        createdAt: now - 86400000,
        updatedAt: now - 86400000,
        description: 'Spontaneous concepts, startup ideas, and design inspiration',
      },
      initialContent: createDoc([
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Digital Notebook Experience' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Why do physical notebooks feel so satisfying? It is the bounded space, the texture, and the absence of complex toolbars.',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'By recreating the authentic Classmate-style ruled margins and center crease, the writing experience becomes intimate and focused.',
            },
          ],
        },
      ]),
    },
    {
      notebook: {
        id: generateId(),
        title: 'Meeting Notes & Decisions',
        category: 'Work & Strategy',
        subject: 'Work & Strategy',
        coverColor: '#065F46',
        coverPattern: 'solid',
        paperStyle: 'ruled',
        pageCount: 1,
        createdAt: now - 3600000,
        updatedAt: now - 3600000,
        description: 'Key takeaways, team discussions, and action points',
      },
      initialContent: createDoc([
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Weekly Sync & Strategy Alignment' }],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', marks: [{ type: 'bold' }], text: 'Key Decisions:' },
          ],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [{
                type: 'paragraph',
                content: [{ type: 'text', text: 'Adopt general-purpose notebook experience for all audiences.' }],
              }],
            },
            {
              type: 'listItem',
              content: [{
                type: 'paragraph',
                content: [{ type: 'text', text: 'Maintain the authentic physical paper feel with modern UX.' }],
              }],
            },
          ],
        },
      ]),
    },
    {
      notebook: {
        id: generateId(),
        title: 'Reading Notes & Quotes',
        category: 'Reading & Notes',
        subject: 'Reading & Notes',
        coverColor: '#1C1917',
        coverPattern: 'solid',
        paperStyle: 'ruled',
        pageCount: 1,
        createdAt: now,
        updatedAt: now,
        description: 'Excerpts, literary notes, and favorite passages',
      },
      initialContent: createDoc([
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Selected Excerpts' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              marks: [{ type: 'italic' }],
              text: '"A reader lives a thousand lives before he dies. The man who never reads lives only one."',
            },
          ],
        },
      ]),
    },
  ];

  for (const item of sampleNotebooks) {
    await saveNotebook(item.notebook);
    const page: Page = {
      id: generateId(),
      notebookId: item.notebook.id,
      pageNumber: 1,
      content: item.initialContent,
      date: new Date(item.notebook.createdAt).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      }),
      createdAt: item.notebook.createdAt,
      updatedAt: item.notebook.updatedAt,
    };
    await savePage(page);
  }
}
