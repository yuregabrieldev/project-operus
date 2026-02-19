
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useBrand } from '@/contexts/BrandContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface BrandFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BrandForm: React.FC<BrandFormProps> = ({ isOpen, onClose }) => {
  const { addBrand } = useBrand();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    primaryColor: '#2563EB',
    logoUrl: '/placeholder.svg'
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    
    try {
      const newBrand = {
        id: Date.now().toString(),
        name: formData.name,
        logoUrl: formData.logoUrl,
        primaryColor: formData.primaryColor,
        storesCount: 0
      };

      await addBrand(newBrand, user.id);
      
      toast({
        title: "Marca criada com sucesso!",
        description: `A marca ${formData.name} foi criada e você já pode utilizá-la.`,
      });

      setFormData({
        name: '',
        primaryColor: '#2563EB',
        logoUrl: '/placeholder.svg'
      });
      
      onClose();
    } catch (error) {
      console.error('Erro ao criar marca:', error?.message);
      toast({
        title: "Erro ao criar marca",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Marca</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Marca</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Digite o nome da marca"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="primaryColor">Cor Principal</Label>
            <div className="flex gap-2">
              <Input
                id="primaryColor"
                type="color"
                value={formData.primaryColor}
                onChange={(e) => handleChange('primaryColor', e.target.value)}
                className="w-16 h-10 p-1"
              />
              <Input
                type="text"
                value={formData.primaryColor}
                onChange={(e) => handleChange('primaryColor', e.target.value)}
                placeholder="#2563EB"
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logoUrl">URL do Logo (opcional)</Label>
            <Input
              id="logoUrl"
              type="text"
              value={formData.logoUrl}
              onChange={(e) => handleChange('logoUrl', e.target.value)}
              placeholder="https://exemplo.com/logo.png"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Criando...' : 'Criar Marca'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
