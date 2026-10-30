import { create } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;
  initializeAuth: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error?: string; message?: string }>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  isInitialized: false,

  initializeAuth: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) console.error('Error fetching session:', error);
      set({ session, user: session?.user ?? null, isLoading: false, isInitialized: true });
      if (session?.user) {
        try {
          const { useProfileStore } = await import('./profileStore');
          await useProfileStore.getState().fetchProfile(session.user.id);
        } catch (e) {
          console.error('Failed to fetch profile on init:', e);
        }
      }

      // Listen for auth state changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        set({ session, user: session?.user ?? null, isLoading: false });
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          try {
            const { useNotebookStore } = await import('./notebookStore');
            await useNotebookStore.getState().loadNotebooks();
          } catch (e) {
            console.error('Failed to reload notebooks after auth change:', e);
          }
          if (session?.user) {
            try {
              const { useProfileStore } = await import('./profileStore');
              await useProfileStore.getState().fetchProfile(session.user.id);
            } catch (e) {
              console.error('Failed to fetch profile after auth change:', e);
            }
          }
        }
        if (event === 'SIGNED_OUT') {
          try {
            const { useProfileStore } = await import('./profileStore');
            useProfileStore.getState().clearProfile();
          } catch {}
        }
      });
    } catch (err) {
      console.error('Failed to initialize auth:', err);
      set({ isLoading: false, isInitialized: true });
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        set({ isLoading: false });
        return { error: error.message };
      }

      set({ session: data.session, user: data.user, isLoading: false });
      return {};
    } catch (err) {
      set({ isLoading: false });
      return { error: (err as Error).message || 'Sign in failed' };
    }
  },

  signUp: async (email, password, fullName) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName?.trim() || '',
          },
        },
      });

      if (error) {
        set({ isLoading: false });
        return { error: error.message };
      }

      set({ session: data.session, user: data.user, isLoading: false });
      if (!data.session) {
        return { message: 'Registration successful! Please check your email inbox to confirm your account.' };
      }
      return {};
    } catch (err) {
      set({ isLoading: false });
      return { error: (err as Error).message || 'Registration failed' };
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    await supabase.auth.signOut();
    try {
      const { useNotebookStore } = await import('./notebookStore');
      useNotebookStore.getState().closeNotebook();
      useNotebookStore.setState({ notebooks: [] });
    } catch {}
    try {
      const { useProfileStore } = await import('./profileStore');
      useProfileStore.getState().clearProfile();
    } catch {}
    set({ session: null, user: null, isLoading: false });
  },
}));
