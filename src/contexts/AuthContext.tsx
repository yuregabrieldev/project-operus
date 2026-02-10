
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'employee';
  hasMultipleBrands?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
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
        email: 'admin@operus.com', 
        password: '123456', 
        name: 'Administrador', 
        role: 'admin' as const,
        hasMultipleBrands: true
      },
      { 
        email: 'manager@operus.com', 
        password: '123456', 
        name: 'Gerente', 
        role: 'manager' as const,
        hasMultipleBrands: true
      },
      { 
        email: 'funcionario@operus.com', 
        password: '123456', 
        name: 'Funcionário', 
        role: 'employee' as const,
        hasMultipleBrands: false
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
      role: 'employee',
      hasMultipleBrands: false,
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

  const value = {
    user,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    loading,
    needsBrandSelection,
    setNeedsBrandSelection,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
