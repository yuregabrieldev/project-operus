
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useBrand } from '@/contexts/BrandContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface StoreEditFormProps {
  store: any;
  isOpen: boolean;
  onClose: () => void;
}

export const StoreEditForm: React.FC<StoreEditFormProps> = ({ store, isOpen, onClose }) => {
  const { userBrands, updateStore } = useBrand();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contact: '',
    manager: '',
    brandId: '',
    isActive: true
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (store) {
      setFormData({
        name: store.name || '',
        address: store.address || '',
        contact: store.contact || '',
        manager: store.manager || '',
        brandId: store.brandId || '',
        isActive: store.isActive !== undefined ? store.isActive : true
      });
    }
  }, [store]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    
    try {
      const updatedStore = {
        ...store,
        name: formData.name,
        address: formData.address,
        contact: formData.contact,
        manager: formData.manager,
        brandId: formData.brandId,
        isActive: formData.isActive,
        updatedAt: new Date().toISOString()
      };

      await updateStore(updatedStore);
      
      toast({
        title: "Loja atualizada com sucesso!",
        description: `As informações da loja ${formData.name} foram atualizadas.`,
      });
      
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar loja:', error);
      toast({
        title: "Erro ao atualizar loja",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const selectedBrand = userBrands.find(brand => brand.id === formData.brandId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Loja - {store?.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Loja</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Digite o nome da loja"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              type="text"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Endereço completo da loja"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact">Telefone de Contato</Label>
            <Input
              id="contact"
              type="tel"
              value={formData.contact}
              onChange={(e) => handleChange('contact', e.target.value)}
              placeholder="(11) 99999-9999"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="manager">Gerente Responsável</Label>
            <Input
              id="manager"
              type="text"
              value={formData.manager}
              onChange={(e) => handleChange('manager', e.target.value)}
              placeholder="Nome do gerente da loja"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand">Marca</Label>
            <Select value={formData.brandId} onValueChange={(value) => handleChange('brandId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a marca" />
              </SelectTrigger>
              <SelectContent>
                {userBrands.map(brand => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => handleChange('isActive', e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="isActive">Loja ativa</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
