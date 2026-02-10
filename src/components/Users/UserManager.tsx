
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserList } from './UserList';
import { UserForm } from './UserForm';
import { UserEditForm } from './UserEditForm';

export const UserManager: React.FC = () => {
  const { user } = useAuth();
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

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

  const handleEditUser = (userData: any) => {
    setEditingUser(userData);
  };

  const handleCloseEdit = () => {
    setEditingUser(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie usuários e suas permissões no sistema
          </p>
        </div>
        
        <Button onClick={() => setIsCreateFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Usuário
        </Button>
      </div>

      <UserList onEditUser={handleEditUser} />

      <UserForm 
        isOpen={isCreateFormOpen} 
        onClose={() => setIsCreateFormOpen(false)} 
      />

      {editingUser && (
        <UserEditForm
          user={editingUser}
          isOpen={!!editingUser}
          onClose={handleCloseEdit}
        />
      )}
    </div>
  );
};
