
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
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
  login: (email: string, password: string) => Promise<boolean>;
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsBrandSelection, setNeedsBrandSelection] = useState(false);

  useEffect(() => {
    // Verificar se há um usuário salvo no localStorage
    const savedUser = localStorage.getItem('operus_user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);

      // Verificar se precisa selecionar marca
      const selectedBrand = localStorage.getItem('selected_brand');
      if (userData.hasMultipleBrands && !selectedBrand) {
        setNeedsBrandSelection(true);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);

    // Simular uma chamada de API
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Credenciais de exemplo com informação de múltiplas marcas
    const validCredentials = [
      {
        email: 'dev@operus.com',
        password: '123456',
        name: 'Desenvolvedor',
        role: 'developer' as const,
        hasMultipleBrands: false,
        permissions: ['*'],
        pin: undefined as string | undefined,
      },
      {
        email: 'admin@operus.com',
        password: '123456',
        name: 'Administrador',
        role: 'admin' as const,
        hasMultipleBrands: true,
        permissions: ['dashboard', 'inventory', 'operations', 'transit', 'purchases', 'cashbox', 'invoices', 'licenses', 'waste', 'checklists', 'stores', 'users', 'settings'],
        pin: undefined as string | undefined,
      },
      {
        email: 'manager@operus.com',
        password: '123456',
        name: 'Gerente',
        role: 'manager' as const,
        hasMultipleBrands: true,
        permissions: ['dashboard', 'inventory', 'operations', 'transit', 'purchases', 'cashbox', 'invoices', 'licenses', 'waste', 'checklists', 'users', 'settings'],
        pin: undefined as string | undefined,
      },
      {
        email: 'funcionario@operus.com',
        password: '123456',
        name: 'Assistente',
        role: 'assistant' as const,
        hasMultipleBrands: false,
        permissions: ['inventory', 'operations', 'transit', 'purchases', 'waste', 'checklists'],
        pin: '1234',
      },
    ];

    const userCredentials = validCredentials.find(
      cred => cred.email === email && cred.password === password
    );

    if (userCredentials) {
      const userData: User = {
        id: Math.random().toString(36),
        name: userCredentials.name,
        email: userCredentials.email,
        role: userCredentials.role,
        hasMultipleBrands: userCredentials.hasMultipleBrands,
        permissions: userCredentials.permissions,
        pin: userCredentials.pin,
      };

      setUser(userData);
      localStorage.setItem('operus_user', JSON.stringify(userData));

      // Verificar se precisa selecionar marca
      if (userData.hasMultipleBrands) {
        const selectedBrand = localStorage.getItem('selected_brand');
        if (!selectedBrand) {
          setNeedsBrandSelection(true);
        }
      }

      setLoading(false);
      return true;
    }

    setLoading(false);
    return false;
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    setLoading(true);

    // Simular uma chamada de API
    await new Promise(resolve => setTimeout(resolve, 1000));

    const userData: User = {
      id: Math.random().toString(36),
      name,
      email,
      role: 'assistant',
      hasMultipleBrands: false,
      permissions: ['inventory', 'operations', 'transit', 'purchases', 'waste', 'checklists'],
    };

    setUser(userData);
    localStorage.setItem('operus_user', JSON.stringify(userData));
    setLoading(false);
    return true;
  };

  const logout = () => {
    setUser(null);
    setNeedsBrandSelection(false);
    localStorage.removeItem('operus_user');
    localStorage.removeItem('selected_brand');
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem('operus_user', JSON.stringify(updatedUser));
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
