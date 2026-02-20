import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '@/lib/supabase-services';
import { isDeveloperEmail } from '@/lib/developer-access';
import type { DbProfile } from '@/types/database';
import type { Session } from '@supabase/supabase-js';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'developer' | 'admin' | 'manager' | 'assistant';
  hasMultipleBrands?: boolean;
  imageUrl?: string;
  permissions?: string[];
  pin?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  isAuthenticated: boolean;
  loading: boolean;
  needsBrandSelection: boolean;
  setNeedsBrandSelection: (needs: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

function profileToUser(profile: DbProfile): User {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    imageUrl: profile.image_url ?? undefined,
    permissions: profile.permissions ?? [],
    pin: profile.pin ?? undefined,
    hasMultipleBrands: undefined,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsBrandSelection, setNeedsBrandSelection] = useState(false);

  const loadProfile = async (session: Session | null) => {
    if (!session?.user) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const profile = await authService.getProfile(session.user.id);
      if (profile) {
        const u = profileToUser(profile);
        if (isDeveloperEmail(u.email)) u.role = 'developer';
        setUser(u);

        const selectedBrand = localStorage.getItem('selected_brand');
        if (!selectedBrand && u.role !== 'developer') {
          setNeedsBrandSelection(true);
        }
      } else {
        const role = isDeveloperEmail(session.user.email) ? 'developer' : (session.user.app_metadata?.role === 'developer' ? 'developer' : 'assistant');
        setUser({
          id: session.user.id,
          name: session.user.user_metadata?.name || session.user.email || '',
          email: session.user.email || '',
          role,
          permissions: [],
        });
      }
    } catch (err) {
      console.error('Error loading profile:', err?.message);
      const role = session?.user && isDeveloperEmail(session.user.email) ? 'developer' : (session?.user?.app_metadata?.role === 'developer' ? 'developer' : 'assistant');
      setUser(session?.user ? {
        id: session.user.id,
        name: session.user.user_metadata?.name || session.user.email || '',
        email: session.user.email || '',
        role,
        permissions: [],
      } : null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    authService.getSession().then(({ data }) => {
      loadProfile(data.session);
    });

    const { data: { subscription } } = authService.onAuthStateChange((_event, session) => {
      if (_event === 'SIGNED_IN' || _event === 'TOKEN_REFRESHED') {
        loadProfile(session);
      } else if (_event === 'SIGNED_OUT') {
        setUser(null);
        setNeedsBrandSelection(false);
        localStorage.removeItem('selected_brand');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const { error } = await authService.signIn(normalizedEmail, password);
      if (error) {
        setLoading(false);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      setLoading(false);
      return { success: false, error: err?.message || 'Unknown login error' };
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { error } = await authService.signUp(email, password, { name, role: 'assistant' });
      if (error) {
        setLoading(false);
        return false;
      }
      return true;
    } catch {
      setLoading(false);
      return false;
    }
  };

  const logout = async () => {
    await authService.signOut();
    setUser(null);
    setNeedsBrandSelection(false);
    localStorage.removeItem('selected_brand');
  };

  const updateUser = async (data: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...data };
    setUser(updatedUser);

    try {
      const dbUpdates: any = {};
      if (data.name !== undefined) dbUpdates.name = data.name;
      if (data.imageUrl !== undefined) dbUpdates.image_url = data.imageUrl;
      if (data.permissions !== undefined) dbUpdates.permissions = data.permissions;
      if (data.pin !== undefined) dbUpdates.pin = data.pin;
      if (Object.keys(dbUpdates).length > 0) {
        await authService.updateProfile(user.id, dbUpdates);
      }
    } catch (err) {
      console.error('Error updating profile:', err?.message);
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
    loading,
    needsBrandSelection,
    setNeedsBrandSelection,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
