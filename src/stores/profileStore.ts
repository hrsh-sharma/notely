import { create } from 'zustand';
import { supabase } from '../services/supabase';

export interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string | null;
}

interface ProfileState {
  profile: UserProfile | null;
  isLoadingProfile: boolean;
  profileError: string | null;
  fetchProfile: (userId: string) => Promise<void>;
  updateProfile: (userId: string, updates: Pick<UserProfile, 'full_name' | 'avatar_url'>) => Promise<{ error?: string }>;
  clearProfile: () => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  isLoadingProfile: false,
  profileError: null,

  fetchProfile: async (userId: string) => {
    set({ isLoadingProfile: true, profileError: null });
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, created_at')
        .eq('id', userId)
        .single();

      if (error) {
        // PGRST116 = row not found
        if (error.code === 'PGRST116') {
          set({ profile: null, isLoadingProfile: false });
        } else {
          console.error('Error fetching profile:', error);
          set({ profileError: error.message, isLoadingProfile: false });
        }
        return;
      }

      set({ profile: data as UserProfile, isLoadingProfile: false });
    } catch (err) {
      console.error('Profile fetch failed:', err);
      set({ profileError: (err as Error).message, isLoadingProfile: false });
    }
  },

  updateProfile: async (userId: string, updates) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ full_name: updates.full_name, avatar_url: updates.avatar_url })
        .eq('id', userId)
        .select('id, full_name, avatar_url, created_at')
        .single();

      if (error) {
        console.error('Profile update error:', error);
        return { error: error.message };
      }

      set({ profile: data as UserProfile });
      return {};
    } catch (err) {
      return { error: (err as Error).message || 'Update failed' };
    }
  },

  clearProfile: () => set({ profile: null, profileError: null }),
}));
