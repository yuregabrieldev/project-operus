
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
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff, Shield, Lock } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface UserEditFormProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
}

export const UserEditForm: React.FC<UserEditFormProps> = ({ user, isOpen, onClose }) => {
  const { updateUser } = useUsers();
  const { stores } = useBrand();
  const { user: currentUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'assistant' as 'admin' | 'manager' | 'assistant',
    selectedStores: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Page permissions
  const [permissions, setPermissions] = useState({
    dashboard: true,
    inventory: true,
    operations: true,
    cash: true,
    transit: false,
    invoices: false,
    production: false,
    waste: false,
    checklist: true,
    reports: false,
    users: false,
  });

  // PIN management
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);

  const canEditPermissions = currentUser?.role === 'admin' || (currentUser?.role === 'manager' && formData.role === 'assistant');
  const canEditPin = (currentUser?.role === 'admin') || (currentUser?.role === 'manager' && formData.role === 'assistant');
  const canViewPin = canEditPin;

  const allStores = stores || [];

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        selectedStores: user.stores.map((store: any) => store.id.toString()),
      });
      setPin(user.pin || '0000');
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
                <SelectItem value="assistant">Assistente</SelectItem>
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

          {/* Page Permissions */}
          {canEditPermissions && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Shield className="h-4 w-4 text-blue-600" /> Permissões de Acesso</Label>
              <Card>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { key: 'dashboard', label: 'Dashboard' },
                      { key: 'inventory', label: 'Estoque' },
                      { key: 'operations', label: 'Operações' },
                      { key: 'cash', label: 'Caixa' },
                      { key: 'transit', label: 'Trânsito' },
                      { key: 'invoices', label: 'Faturas' },
                      { key: 'production', label: 'Produção' },
                      { key: 'waste', label: 'Desperdício' },
                      { key: 'checklist', label: 'Checklist' },
                      { key: 'reports', label: 'Relatórios' },
                      { key: 'users', label: 'Usuários' },
                    ] as const).map(p => (
                      <div key={p.key} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{p.label}</span>
                        <Switch checked={permissions[p.key]} onCheckedChange={v => setPermissions(prev => ({ ...prev, [p.key]: v }))} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* PIN Management */}
          {canViewPin && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Lock className="h-4 w-4 text-amber-600" /> PIN de Acesso</Label>
              <div className="flex items-center gap-2">
                <Input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={e => { if (canEditPin) setPin(e.target.value.replace(/\D/g, '').slice(0, 6)); }}
                  readOnly={!canEditPin}
                  maxLength={6}
                  className="w-32 font-mono text-center tracking-widest"
                  placeholder="••••"
                />
                <Button type="button" variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => setShowPin(!showPin)}>
                  {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-gray-400">PIN numérico de 4-6 dígitos para acesso rápido</p>
            </div>
          )}

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
