
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useBrand } from '@/contexts/BrandContext';
import { StoreList } from './StoreList';
import { StoreForm } from './StoreForm';
import { StoreEditForm } from './StoreEditForm';

export const StoreManager: React.FC = () => {
  const { user } = useAuth();
  const { userBrands } = useBrand();
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [editingStore, setEditingStore] = useState(null);

  // Verificar se o usuário é admin
  if (user?.role !== 'admin') {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground">
                Acesso negado. Esta seção é exclusiva para administradores.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleEditStore = (store: any) => {
    setEditingStore(store);
  };

  const handleCloseEdit = () => {
    setEditingStore(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Lojas</h1>
          <p className="text-muted-foreground">
            Gerencie todas as lojas do sistema
          </p>
        </div>
        
        <Button onClick={() => setIsCreateFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Loja
        </Button>
      </div>

      <StoreList onEditStore={handleEditStore} />

      <StoreForm 
        isOpen={isCreateFormOpen} 
        onClose={() => setIsCreateFormOpen(false)} 
      />

      {editingStore && (
        <StoreEditForm
          store={editingStore}
          isOpen={!!editingStore}
          onClose={handleCloseEdit}
        />
      )}
    </div>
  );
};
