
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface Brand {
  id: string;
  name: string;
  logoUrl: string;
  primaryColor: string;
  storesCount: number;
}

export interface Store {
  id: string;
  brandId: string;
  name: string;
  address: string;
  contact: string;
  manager: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface UserBrand {
  userId: string;
  brandId: string;
  role: 'admin' | 'manager' | 'operator';
  isPrimary?: boolean;
}

interface BrandContextType {
  selectedBrand: Brand | null;
  userBrands: Brand[];
  stores: Store[];
  setSelectedBrand: (brand: Brand) => void;
  loadUserBrands: (userId: string, userRole?: string) => void;
  addBrand: (brand: Brand, userId: string) => Promise<void>;
  addStore: (store: Store) => Promise<void>;
  updateStore: (store: Store) => Promise<void>;
  toggleStoreStatus: (storeId: string) => Promise<void>;
  isLoading: boolean;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export const useBrand = () => {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
};

export const BrandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedBrand, setSelectedBrandState] = useState<Brand | null>(null);
  const [userBrands, setUserBrands] = useState<Brand[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data - em produção virá da API
  const mockBrands: Brand[] = [
    {
      id: '1',
      name: 'Oakberry',
      logoUrl: '/placeholder.svg',
      primaryColor: '#2563EB',
      storesCount: 12
    },
    {
      id: '2',
      name: 'Spike',
      logoUrl: '/placeholder.svg',
      primaryColor: '#8B5CF6',
      storesCount: 5
    },
    {
      id: '3',
      name: 'Green Bowl',
      logoUrl: '/placeholder.svg',
      primaryColor: '#10B981',
      storesCount: 8
    }
  ];

  // Mock stores data
  const mockStores: Store[] = [
    {
      id: '1',
      brandId: '1',
      name: 'Alvalade',
      address: 'Rua A, 123',
      contact: '(11) 99999-1111',
      manager: 'João Silva',
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      brandId: '1',
      name: 'Rossio',
      address: 'Rua B, 456',
      contact: '(11) 99999-2222',
      manager: 'Maria Santos',
      isActive: false,
      createdAt: new Date().toISOString()
    },
    {
      id: '3',
      brandId: '2',
      name: 'Saldanha',
      address: 'Rua C, 789',
      contact: '(11) 99999-3333',
      manager: 'Pedro Costa',
      isActive: true,
      createdAt: new Date().toISOString()
    }
  ];

  const loadUserBrands = useCallback(async (userId: string, userRole?: string) => {
    console.log('🔄 Iniciando carregamento das marcas para userId:', userId, 'userRole:', userRole);
    
    if (isLoading) {
      console.log('⚠️ Já está carregando, ignorando nova chamada');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Simular chamada da API
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Buscar marcas baseado no role do usuário
      let brandsToSet: Brand[] = [];
      
      if (userRole === 'admin') {
        brandsToSet = mockBrands;
        console.log('👑 Usuário admin - carregando todas as marcas:', brandsToSet);
        // Admin também carrega todas as lojas mock
        setStores(mockStores);
      } else if (userRole === 'manager') {
        brandsToSet = mockBrands.slice(0, 2);
        console.log('👔 Usuário manager - carregando marcas limitadas:', brandsToSet);
        // Manager carrega lojas das suas marcas
        setStores(mockStores.filter(store => 
          brandsToSet.some(brand => brand.id === store.brandId)
        ));
      } else {
        brandsToSet = [mockBrands[0]];
        console.log('👤 Usuário comum - carregando marca única:', brandsToSet);
        // Funcionário carrega apenas lojas da sua marca
        setStores(mockStores.filter(store => store.brandId === '1'));
      }
      
      setUserBrands(brandsToSet);
      console.log('✅ Marcas carregadas com sucesso, total:', brandsToSet.length);
    } catch (error) {
      console.error('❌ Erro ao carregar marcas:', error);
      setUserBrands([]);
    } finally {
      setIsLoading(false);
      console.log('🏁 Carregamento finalizado, isLoading definido como false');
    }
  }, [isLoading, mockBrands, mockStores]);

  const addBrand = async (brand: Brand, userId: string) => {
    console.log('🏢 Adicionando nova marca:', brand);
    
    try {
      // Simular chamada da API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Adicionar à lista local (em produção seria salvo no banco)
      setUserBrands(prev => [...prev, brand]);
      console.log('✅ Marca adicionada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao adicionar marca:', error);
      throw error;
    }
  };

  const addStore = async (store: Store) => {
    console.log('🏪 Adicionando nova loja:', store);
    
    try {
      // Simular chamada da API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Adicionar à lista local
      setStores(prev => [...prev, store]);
      
      // Atualizar contador de lojas da marca
      setUserBrands(prev => prev.map(brand => 
        brand.id === store.brandId 
          ? { ...brand, storesCount: brand.storesCount + 1 }
          : brand
      ));
      
      console.log('✅ Loja adicionada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao adicionar loja:', error);
      throw error;
    }
  };

  const updateStore = async (updatedStore: Store) => {
    console.log('🔄 Atualizando loja:', updatedStore);
    
    try {
      // Simular chamada da API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Atualizar na lista local
      setStores(prev => prev.map(store => 
        store.id === updatedStore.id ? updatedStore : store
      ));
      
      console.log('✅ Loja atualizada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao atualizar loja:', error);
      throw error;
    }
  };

  const toggleStoreStatus = async (storeId: string) => {
    console.log('🔄 Alterando status da loja:', storeId);
    
    try {
      // Simular chamada da API
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Alterar status na lista local
      setStores(prev => prev.map(store => 
        store.id === storeId 
          ? { ...store, isActive: !store.isActive, updatedAt: new Date().toISOString() }
          : store
      ));
      
      console.log('✅ Status da loja alterado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao alterar status da loja:', error);
      throw error;
    }
  };

  const setSelectedBrand = (brand: Brand) => {
    console.log('🎯 Marca selecionada:', brand);
    setSelectedBrandState(brand);
    localStorage.setItem('selected_brand', JSON.stringify(brand));
    
    // Aplicar tema da marca
    document.documentElement.style.setProperty('--brand-primary', brand.primaryColor);
  };

  useEffect(() => {
    // Recuperar marca selecionada do localStorage
    const savedBrand = localStorage.getItem('selected_brand');
    if (savedBrand) {
      console.log('💾 Recuperando marca salva do localStorage');
      const brand = JSON.parse(savedBrand);
      setSelectedBrandState(brand);
      document.documentElement.style.setProperty('--brand-primary', brand.primaryColor);
    }
  }, []);

  const value = {
    selectedBrand,
    userBrands,
    stores,
    setSelectedBrand,
    loadUserBrands,
    addBrand,
    addStore,
    updateStore,
    toggleStoreStatus,
    isLoading
  };

  return (
    <BrandContext.Provider value={value}>
      {children}
    </BrandContext.Provider>
  );
};
