
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useBrand } from '@/contexts/BrandContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface StoreFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StoreForm: React.FC<StoreFormProps> = ({ isOpen, onClose }) => {
  const { selectedBrand, addStore } = useBrand();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contact: '',
    manager: '',
    isActive: true
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedBrand) return;

    setIsLoading(true);
    
    try {
      const newStore = {
        id: Date.now().toString(),
        brandId: selectedBrand.id,
        name: formData.name,
        address: formData.address,
        contact: formData.contact,
        manager: formData.manager,
        isActive: formData.isActive,
        createdAt: new Date().toISOString()
      };

      await addStore(newStore);
      
      toast({
        title: "Loja criada com sucesso!",
        description: `A loja ${formData.name} foi criada para a marca ${selectedBrand.name}.`,
      });

      setFormData({
        name: '',
        address: '',
        contact: '',
        manager: '',
        isActive: true
      });
      
      onClose();
    } catch (error) {
      console.error('Erro ao criar loja:', error);
      toast({
        title: "Erro ao criar loja",
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Loja - {selectedBrand?.name}</DialogTitle>
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
              {isLoading ? 'Criando...' : 'Criar Loja'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
