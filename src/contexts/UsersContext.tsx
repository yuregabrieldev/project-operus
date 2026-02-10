import React, { createContext, useContext, useState, useEffect } from 'react';
import { useBrand } from './BrandContext';

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
  role: 'admin' | 'manager' | 'employee';
  stores: Store[];
  isActive: boolean;
  createdAt: Date;
  needsPasswordChange?: boolean;
}

interface CreateUserData {
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'employee';
  stores: Store[];
  sendWelcomeEmail?: boolean;
}

interface UpdateUserData {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'employee';
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

  // Inicializar com usuários mock
  useEffect(() => {
    if (stores && stores.length > 0) {
      // Convert Store objects to the format expected by User interface
      const convertedStores = stores.map(store => ({
        id: parseInt(store.id),
        name: store.name,
        address: store.address,
        isActive: store.isActive
      }));

      const mockUsers: User[] = [
        {
          id: '1',
          name: 'Ana Silva',
          email: 'ana@operus.com',
          role: 'manager',
          stores: convertedStores.slice(0, 2),
          isActive: true,
          createdAt: new Date('2024-01-15'),
        },
        {
          id: '2',
          name: 'Carlos Santos',
          email: 'carlos@operus.com',
          role: 'employee',
          stores: convertedStores.slice(0, 1),
          isActive: true,
          createdAt: new Date('2024-02-20'),
        },
        {
          id: '3',
          name: 'Maria Costa',
          email: 'maria@operus.com',
          role: 'employee',
          stores: convertedStores.slice(1, 3),
          isActive: false,
          createdAt: new Date('2024-01-10'),
        },
      ];

      setUsers(mockUsers);
    }
  }, [stores]);

  const addUser = (userData: CreateUserData): string => {
    const tempPassword = generateRandomPassword();
    
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: userData.name,
      email: userData.email,
      role: userData.role,
      stores: userData.stores,
      isActive: true,
      createdAt: new Date(),
      needsPasswordChange: true,
    };

    setUsers(prev => [...prev, newUser]);
    
    // Simular envio de email de boas-vindas
    if (userData.sendWelcomeEmail) {
      console.log(`📧 Email de boas-vindas enviado para ${userData.email} com senha temporária: ${tempPassword}`);
    }

    return tempPassword;
  };

  const updateUser = (userData: UpdateUserData) => {
    setUsers(prev => 
      prev.map(user => 
        user.id === userData.id 
          ? { 
              ...user, 
              name: userData.name,
              email: userData.email,
              role: userData.role,
              stores: userData.stores
            }
          : user
      )
    );
  };

  const toggleUserStatus = (userId: string) => {
    setUsers(prev => 
      prev.map(user => 
        user.id === userId 
          ? { ...user, isActive: !user.isActive }
          : user
      )
    );
  };

  const generateTempPassword = (userId: string): string => {
    const tempPassword = generateRandomPassword();
    
    // Marcar que o usuário precisa trocar a senha
    setUsers(prev => 
      prev.map(user => 
        user.id === userId 
          ? { ...user, needsPasswordChange: true }
          : user
      )
    );

    console.log(`🔑 Nova senha temporária gerada para usuário ${userId}: ${tempPassword}`);
    return tempPassword;
  };

  const deleteUser = (userId: string) => {
    setUsers(prev => prev.filter(user => user.id !== userId));
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
