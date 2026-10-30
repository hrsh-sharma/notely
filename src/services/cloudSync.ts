import { supabase } from './supabase';
import type { Notebook, Page } from '../types';
import * as db from './db';

// Helper to get current authenticated user safely
export async function getCurrentUser() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

// Convert Notebook model to Supabase row format
function toSupabaseNotebook(n: Notebook, userId: string) {
  return {
    id: n.id,
    user_id: userId,
    title: n.title,
    category: n.category || n.subject || 'General',
    cover_color: n.coverColor,
    cover_pattern: n.coverPattern || 'solid',
    paper_style: n.paperStyle || 'ruled',
    description: n.description || '',
    created_at: new Date(n.createdAt).toISOString(),
    updated_at: new Date(n.updatedAt).toISOString(),
  };
}

// Convert Supabase row to Notebook model
function fromSupabaseNotebook(row: any): Notebook {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    subject: row.category,
    coverColor: row.cover_color,
    coverPattern: row.cover_pattern,
    paperStyle: row.paper_style,
    pageCount: row.page_count ?? 1,  // column may not exist; default to 1
    description: row.description || '',
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
  };
}

// Convert Page model to Supabase row format
function toSupabasePage(p: Page, userId: string) {
  return {
    id: p.id,
    notebook_id: p.notebookId,
    user_id: userId,
    page_number: p.pageNumber,
    content: p.content || '',
    date: p.date || null,
    created_at: new Date(p.createdAt).toISOString(),
    updated_at: new Date(p.updatedAt).toISOString(),
  };
}

// Convert Supabase row to Page model
function fromSupabasePage(row: any): Page {
  return {
    id: row.id,
    notebookId: row.notebook_id,
    pageNumber: row.page_number,
    content: row.content || '',
    date: row.date || undefined,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
  };
}

/**
 * Sync all cloud notebooks and pages down to local IndexedDB for this user
 */
export async function syncFromCloud(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  try {
    const { data: cloudNotebooks, error } = await supabase
      .from('notebooks')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.warn('Cloud sync note: tables may not exist yet in Supabase:', error.message);
    }

    const cloudList = cloudNotebooks || [];
    const cloudIds = new Set(cloudList.map(n => n.id));

    // Sample notebook patterns that were previously auto-seeded
    const isSampleNotebook = (title: string) => {
      const t = title.toLowerCase().trim();
      return (
        t.includes('product & architecture') ||
        t.includes('daily journal & reflections') ||
        t.includes('creative ideas & brainstorms') ||
        t.includes('meeting notes') ||
        t.includes('reading notes') ||
        t.includes('mathematics & logic') ||
        t.includes('physics & science')
      );
    };

    // Clean up local sample notebooks that do not exist in the user's cloud account
    const localNotebooks = await db.getAllNotebooks();
    for (const local of localNotebooks) {
      if (isSampleNotebook(local.title) && !cloudIds.has(local.id)) {
        await db.deleteNotebook(local.id);
      }
    }

    if (cloudList.length > 0) {
      for (const row of cloudList) {
        const notebook = fromSupabaseNotebook(row);
        await db.saveNotebook(notebook);
      }

      // Fetch pages for user
      const { data: cloudPages } = await supabase
        .from('pages')
        .select('*')
        .eq('user_id', user.id);

      if (cloudPages && cloudPages.length > 0) {
        for (const row of cloudPages) {
          const page = fromSupabasePage(row);
          await db.savePage(page);
        }
      }
    }
  } catch (err) {
    console.error('Failed to sync from cloud:', err);
  }
}

/**
 * Cloud push for saving a notebook
 */
export async function cloudSaveNotebook(notebook: Notebook): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    console.warn('cloudSaveNotebook: no authenticated user, skipping.');
    return;
  }

  const { error } = await supabase
    .from('notebooks')
    .upsert(toSupabaseNotebook(notebook, user.id), { onConflict: 'id' });

  if (error) {
    console.error('cloudSaveNotebook error:', error.message, error.details, error.hint);
  }
}

/**
 * Cloud push for deleting a notebook
 */
export async function cloudDeleteNotebook(notebookId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  try {
    await supabase
      .from('notebooks')
      .delete()
      .eq('id', notebookId)
      .eq('user_id', user.id);
  } catch (err) {
    console.warn('Could not delete notebook from cloud:', err);
  }
}

/**
 * Cloud push for saving a page
 */
export async function cloudSavePage(page: Page): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    console.warn('cloudSavePage: no authenticated user, skipping.');
    return;
  }

  const { error } = await supabase
    .from('pages')
    .upsert(toSupabasePage(page, user.id), { onConflict: 'id' });

  if (error) {
    console.error('cloudSavePage error:', error.message, error.details, error.hint);
  }
}

/**
 * Cloud push for deleting a page
 */
export async function cloudDeletePage(pageId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  try {
    await supabase
      .from('pages')
      .delete()
      .eq('id', pageId)
      .eq('user_id', user.id);
  } catch (err) {
    console.warn('Could not delete page from cloud:', err);
  }
}
