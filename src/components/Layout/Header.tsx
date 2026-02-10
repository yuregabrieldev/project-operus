
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useBrand } from '@/contexts/BrandContext';
import { useAuth } from '@/contexts/AuthContext';
import { User, LogOut, Plus, Store } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { StoreForm } from '../Store/StoreForm';

const Header: React.FC = () => {
  const { selectedBrand } = useBrand();
  const { user, logout } = useAuth();
  const [showStoreForm, setShowStoreForm] = useState(false);

  const handleLogout = () => {
    logout();
    toast({
      title: "Desconectado",
      description: "Você foi desconectado com sucesso.",
    });
  };

  const handleCreateStore = () => {
    console.log('🏪 Abrindo formulário para criar nova loja');
    setShowStoreForm(true);
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {selectedBrand && (
            <div className="flex items-center space-x-3">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: selectedBrand.primaryColor }}
              >
                {selectedBrand.name.charAt(0)}
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">{selectedBrand.name}</h2>
                <p className="text-sm text-gray-500">{selectedBrand.storesCount} lojas</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {selectedBrand && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCreateStore}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <Store className="w-4 h-4" />
              Nova Loja
            </Button>
          )}
          
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">{user?.name}</span>
          </div>
          
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <StoreForm 
        isOpen={showStoreForm} 
        onClose={() => setShowStoreForm(false)} 
      />
    </header>
  );
};

export default Header;
