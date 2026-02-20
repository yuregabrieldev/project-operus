import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useBrand } from './BrandContext';
import { usersService } from '@/lib/supabase-services';
import { supabase } from '@/lib/supabase';
import { FunctionsHttpError } from '@supabase/supabase-js';

interface Store {
  id: number;
  name: string;
  address: string;
  isActive: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'assistant';
  stores: Store[];
  isActive: boolean;
  createdAt: Date;
  needsPasswordChange?: boolean;
}

interface CreateUserData {
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'assistant';
  stores: Store[];
  storeIds: string[];
  password: string;
  sendWelcomeEmail?: boolean;
}

interface UpdateUserData {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'assistant';
  stores: Store[];
}

interface UsersContextType {
  users: User[];
  addUser: (userData: CreateUserData) => Promise<void>;
  updateUser: (userData: UpdateUserData) => void;
  toggleUserStatus: (userId: string) => void;
  generateTempPassword: (userId: string) => string;
  deleteUser: (userId: string) => void;
}

const UsersContext = createContext<UsersContextType | undefined>(undefined);

export const useUsers = () => {
  const context = useContext(UsersContext);
  if (context === undefined) {
    throw new Error('useUsers must be used within a UsersProvider');
  }
  return context;
};

const generateRandomPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export const UsersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { selectedBrand, stores } = useBrand();
  const [users, setUsers] = useState<User[]>([]);

  const loadUsers = useCallback(async () => {
    if (!selectedBrand?.id) return;
    try {
      const profiles = await usersService.getByBrand(selectedBrand.id);
      const mappedUsers: User[] = profiles.map(p => {
        const userStores = stores
          .filter(s => s.brandId === selectedBrand.id)
          .map(s => ({ id: parseInt(s.id) || 0, name: s.name, address: s.address, isActive: s.isActive }));

        return {
          id: p.id,
          name: p.name,
          email: p.email,
          role: (p.role === 'developer' ? 'admin' : p.role) as 'admin' | 'manager' | 'assistant',
          stores: userStores,
          isActive: p.is_active,
          createdAt: new Date(p.created_at),
          needsPasswordChange: p.needs_password_change,
        };
      });
      setUsers(mappedUsers);
    } catch (err) {
      console.error('Error loading users:', err?.message);
    }
  }, [selectedBrand?.id, stores]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const addUser = async (userData: CreateUserData): Promise<void> => {
    if (!selectedBrand?.id) throw new Error('No brand selected');
    const { data: sessionData } = await supabase.auth.getSession();
    let accessToken = sessionData.session?.access_token?.trim();
    if (accessToken) {
      const { error: userError } = await supabase.auth.getUser(accessToken);
      if (userError) accessToken = undefined;
    }
    if (!accessToken) {
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        throw new Error(`Sessão inválida: ${refreshError.message}`);
      }
      accessToken = refreshData.session?.access_token?.trim();
    }
    if (!accessToken) {
      throw new Error('Sessão expirada. Faça login novamente e tente criar o usuário.');
    }

    const { data: fnData, error: fnError } = await supabase.functions.invoke('create-user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: {
        email: userData.email,
        password: userData.password,
        name: userData.name,
        role: userData.role,
        brandId: selectedBrand.id,
        storeIds: userData.storeIds,
      },
    });

    if (fnError) {
      let message = fnError.message || 'Erro ao criar usuário';
      if (fnError instanceof FunctionsHttpError) {
        try {
          const rawBody = await fnError.context.text();
          if (rawBody) {
            try {
              const parsed = JSON.parse(rawBody);
              if (parsed?.error) {
                message = parsed.error;
              } else if (typeof parsed?.message === 'string') {
                message = parsed.message;
              } else {
                message = rawBody;
              }
            } catch {
              // Plain text response from function
              message = rawBody;
            }
          }
        } catch {
          // fallback to original message
        }
      }
      throw new Error(message);
    }
    if (fnData?.error) throw new Error(fnData.error);

    await loadUsers();
  };

  const updateUser = (userData: UpdateUserData) => {
    (async () => {
      try {
        await usersService.updateProfile(userData.id, {
          name: userData.name,
          email: userData.email,
          role: userData.role,
        } as any);
        setUsers(prev =>
          prev.map(user =>
            user.id === userData.id
              ? { ...user, name: userData.name, email: userData.email, role: userData.role, stores: userData.stores }
              : user
          )
        );
      } catch (err) {
        console.error('Error updating user:', err?.message);
        setUsers(prev =>
          prev.map(user =>
            user.id === userData.id
              ? { ...user, name: userData.name, email: userData.email, role: userData.role, stores: userData.stores }
              : user
          )
        );
      }
    })();
  };

  const toggleUserStatus = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    (async () => {
      try {
        await usersService.updateProfile(userId, { is_active: !user.isActive } as any);
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !u.isActive } : u));
      } catch (err) {
        console.error('Error toggling user status:', err?.message);
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !u.isActive } : u));
      }
    })();
  };

  const generateTempPassword = (userId: string): string => {
    const tempPassword = generateRandomPassword();
    (async () => {
      try {
        await usersService.updateProfile(userId, { needs_password_change: true } as any);
      } catch (err) {
        console.error('Error generating temp password:', err?.message);
      }
    })();
    setUsers(prev => prev.map(user => user.id === userId ? { ...user, needsPasswordChange: true } : user));
    return tempPassword;
  };

  const deleteUser = (userId: string) => {
    if (!selectedBrand?.id) return;
    (async () => {
      try {
        await usersService.removeUserFromBrand(userId, selectedBrand.id);
        setUsers(prev => prev.filter(user => user.id !== userId));
      } catch (err) {
        console.error('Error deleting user:', err?.message);
        setUsers(prev => prev.filter(user => user.id !== userId));
      }
    })();
  };

  const value = {
    users,
    addUser,
    updateUser,
    toggleUserStatus,
    generateTempPassword,
    deleteUser,
  };

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
};
