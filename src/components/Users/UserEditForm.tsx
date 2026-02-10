
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { useUsers } from '@/contexts/UsersContext';
import { useBrand } from '@/contexts/BrandContext';
import { toast } from '@/hooks/use-toast';

interface UserEditFormProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
}

export const UserEditForm: React.FC<UserEditFormProps> = ({ user, isOpen, onClose }) => {
  const { updateUser } = useUsers();
  const { stores } = useBrand();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'employee' as 'admin' | 'manager' | 'employee',
    selectedStores: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allStores = stores || [];

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        selectedStores: user.stores.map((store: any) => store.id.toString()),
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validações
      if (!formData.name.trim()) {
        throw new Error('Nome é obrigatório');
      }
      if (!formData.email.trim()) {
        throw new Error('Email é obrigatório');
      }
      if (!formData.email.includes('@')) {
        throw new Error('Email inválido');
      }
      if (formData.selectedStores.length === 0) {
        throw new Error('Selecione pelo menos uma loja');
      }

      // Convert selected store IDs to store objects
      const selectedStoreObjects = allStores
        .filter(store => formData.selectedStores.includes(store.id))
        .map(store => ({
          id: parseInt(store.id),
          name: store.name,
          address: store.address,
          isActive: store.isActive
        }));
      
      const userData = {
        id: user.id,
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        stores: selectedStoreObjects,
      };

      updateUser(userData);

      toast({
        title: "Usuário atualizado com sucesso!",
        description: "As informações foram salvas.",
      });

      onClose();
    } catch (error) {
      toast({
        title: "Erro ao atualizar usuário",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStoreToggle = (storeId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedStores: prev.selectedStores.includes(storeId)
        ? prev.selectedStores.filter(id => id !== storeId)
        : [...prev.selectedStores, storeId]
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Digite o nome completo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="usuario@empresa.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Tipo de Usuário</Label>
            <Select value={formData.role} onValueChange={(value: any) => setFormData(prev => ({ ...prev, role: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Funcionário</SelectItem>
                <SelectItem value="manager">Gerente</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Lojas Vinculadas</Label>
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {allStores.map((store) => (
                    <div key={store.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`store-${store.id}`}
                        checked={formData.selectedStores.includes(store.id)}
                        onCheckedChange={() => handleStoreToggle(store.id)}
                      />
                      <Label htmlFor={`store-${store.id}`} className="text-sm">
                        {store.name}
                      </Label>
                    </div>
                  ))}
                </div>
                {allStores.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhuma loja disponível</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
