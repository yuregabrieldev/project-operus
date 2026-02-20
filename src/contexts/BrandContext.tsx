import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { brandsService, storesService } from '@/lib/supabase-services';
import type { DbBrand, DbStore } from '@/types/database';

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
  imageUrl: string | null;
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
  selectedStore: Store | null;
  userBrands: Brand[];
  stores: Store[];
  setSelectedBrand: (brand: Brand) => void;
  setSelectedStore: (store: Store | null) => void;
  loadUserBrands: (userId: string, userRole?: string) => void;
  addBrand: (brand: Brand, userId: string) => Promise<void>;
  addStore: (store: Store) => Promise<void>;
  updateStore: (store: Store) => Promise<void>;
  toggleStoreStatus: (storeId: string) => Promise<void>;
  isLoading: boolean;
  brandsLoaded: boolean;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export const useBrand = () => {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
};

function dbBrandToBrand(db: DbBrand): Brand {
  return {
    id: db.id,
    name: db.name,
    logoUrl: db.logo_url,
    primaryColor: db.primary_color,
    storesCount: db.stores_count,
  };
}

function dbStoreToStore(db: DbStore): Store {
  return {
    id: db.id,
    brandId: db.brand_id,
    name: db.name,
    address: db.address,
    contact: db.contact,
    manager: db.manager,
    isActive: db.is_active,
    imageUrl: db.image_url ?? null,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export const BrandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedBrand, setSelectedBrandState] = useState<Brand | null>(null);
  const [selectedStore, setSelectedStoreState] = useState<Store | null>(null);
  const [userBrands, setUserBrands] = useState<Brand[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [brandsLoaded, setBrandsLoaded] = useState(false);
  const loadingRef = useRef(false);

  const loadStoresForBrands = useCallback(async (brands: Brand[]) => {
    const allStores: Store[] = [];
    for (const brand of brands) {
      try {
        const dbStores = await storesService.getByBrand(brand.id);
        allStores.push(...dbStores.map(dbStoreToStore));
      } catch (err) {
        console.error('Error loading stores for brand:', err?.message);
      }
    }
    setStores(allStores);
  }, []);

  const loadUserBrands = useCallback(async (userId: string, userRole?: string) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setIsLoading(true);

    try {
      const dbBrands = await brandsService.getUserBrands(userId, userRole);
      const brands = dbBrands.map(dbBrandToBrand);
      setUserBrands(brands);
      await loadStoresForBrands(brands);

      const savedBrand = localStorage.getItem('selected_brand');
      if (savedBrand) {
        try {
          const cached = JSON.parse(savedBrand);
          const fresh = brands.find(b => b.id === cached.id);
          if (fresh) {
            setSelectedBrandState(fresh);
            localStorage.setItem('selected_brand', JSON.stringify(fresh));
            document.documentElement.style.setProperty('--brand-primary', fresh.primaryColor);
          } else {
            localStorage.removeItem('selected_brand');
            setSelectedBrandState(null);
          }
        } catch { /* ignore */ }
      }
    } catch (error) {
      console.error('Error loading brands:', error?.message);
      setUserBrands([]);
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
      setBrandsLoaded(true);
    }
  }, [loadStoresForBrands]);

  const addBrand = async (brand: Brand, userId: string) => {
    try {
      const created = await brandsService.createBrand(
        { name: brand.name, logo_url: brand.logoUrl, primary_color: brand.primaryColor },
        userId
      );
      setUserBrands(prev => [...prev, dbBrandToBrand(created)]);
    } catch (error) {
      console.error('Error adding brand:', error?.message);
      throw error;
    }
  };

  const addStore = async (store: Store) => {
    try {
      const created = await storesService.create({
        brand_id: store.brandId,
        name: store.name,
        address: store.address,
        contact: store.contact,
        manager: store.manager,
        is_active: store.isActive,
      });
      setStores(prev => [...prev, dbStoreToStore(created)]);
      setUserBrands(prev =>
        prev.map(b => b.id === store.brandId ? { ...b, storesCount: b.storesCount + 1 } : b)
      );
    } catch (error) {
      console.error('Error adding store:', error?.message);
      throw error;
    }
  };

  const updateStore = async (updatedStore: Store) => {
    try {
      const result = await storesService.update(updatedStore.id, {
        name: updatedStore.name,
        address: updatedStore.address,
        contact: updatedStore.contact,
        manager: updatedStore.manager,
        is_active: updatedStore.isActive,
      });
      setStores(prev => prev.map(s => s.id === result.id ? dbStoreToStore(result) : s));
    } catch (error) {
      console.error('Error updating store:', error?.message);
      throw error;
    }
  };

  const toggleStoreStatus = async (storeId: string) => {
    const store = stores.find(s => s.id === storeId);
    if (!store) return;
    try {
      const result = await storesService.toggleStatus(storeId, store.isActive);
      setStores(prev => prev.map(s => s.id === result.id ? dbStoreToStore(result) : s));
    } catch (error) {
      console.error('Error toggling store status:', error?.message);
      throw error;
    }
  };

  const setSelectedBrand = (brand: Brand) => {
    setSelectedBrandState(brand);
    localStorage.setItem('selected_brand', JSON.stringify(brand));
    document.documentElement.style.setProperty('--brand-primary', brand.primaryColor);
  };

  const setSelectedStore = (store: Store | null) => {
    setSelectedStoreState(store);
    if (store) {
      localStorage.setItem('selected_store', JSON.stringify(store));
    } else {
      localStorage.removeItem('selected_store');
    }
  };

  useEffect(() => {
    const savedBrand = localStorage.getItem('selected_brand');
    if (savedBrand) {
      try {
        const brand = JSON.parse(savedBrand);
        setSelectedBrandState(brand);
        document.documentElement.style.setProperty('--brand-primary', brand.primaryColor);
      } catch { /* ignore */ }
    }
    const savedStore = localStorage.getItem('selected_store');
    if (savedStore) {
      try {
        setSelectedStoreState(JSON.parse(savedStore));
      } catch { /* ignore */ }
    }
  }, []);

  const value = {
    selectedBrand,
    selectedStore,
    userBrands,
    stores,
    setSelectedBrand,
    setSelectedStore,
    loadUserBrands,
    addBrand,
    addStore,
    updateStore,
    toggleStoreStatus,
    isLoading,
    brandsLoaded,
  };

  return (
    <BrandContext.Provider value={value}>
      {children}
    </BrandContext.Provider>
  );
};
