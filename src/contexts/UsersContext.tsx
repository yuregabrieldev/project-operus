import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useBrand } from './BrandContext';
import { usersService, authService } from '@/lib/supabase-services';
import { supabase } from '@/lib/supabase';

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
  addUser: (userData: CreateUserData) => string;
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
      console.error('Error loading users:', err);
    }
  }, [selectedBrand?.id, stores]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const addUser = (userData: CreateUserData): string => {
    const tempPassword = generateRandomPassword();

    (async () => {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: userData.email,
          password: tempPassword,
          options: { data: { name: userData.name, role: userData.role } },
        });
        if (error) throw error;
        if (data.user && selectedBrand?.id) {
          await usersService.addUserToBrand(data.user.id, selectedBrand.id, userData.role);
          await usersService.updateProfile(data.user.id, {
            role: userData.role,
            needs_password_change: true,
            is_active: true,
          } as any);
          await loadUsers();
        }
      } catch (err) {
        console.error('Error creating user:', err);
        const fallbackUser: User = {
          id: Math.random().toString(36).substr(2, 9),
          name: userData.name,
          email: userData.email,
          role: userData.role,
          stores: userData.stores,
          isActive: true,
          createdAt: new Date(),
          needsPasswordChange: true,
        };
        setUsers(prev => [...prev, fallbackUser]);
      }
    })();

    return tempPassword;
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
        console.error('Error updating user:', err);
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
        console.error('Error toggling user status:', err);
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
        console.error('Error generating temp password:', err);
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
        console.error('Error deleting user:', err);
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
