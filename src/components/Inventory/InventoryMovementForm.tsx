
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useData } from '@/contexts/DataContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface InventoryMovementFormProps {
  productId: string;
  onClose: () => void;
}

const InventoryMovementForm: React.FC<InventoryMovementFormProps> = ({ productId, onClose }) => {
  const { t } = useLanguage();
  const { 
    stores, 
    addMovement, 
    updateInventoryItem, 
    inventory, 
    getProductById 
  } = useData();

  const [formData, setFormData] = useState({
    type: 'in' as 'in' | 'out' | 'transfer',
    quantity: 0,
    fromStoreId: '',
    toStoreId: '',
    description: ''
  });

  const product = getProductById(productId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.quantity || formData.quantity <= 0) {
      toast.error('Quantidade deve ser maior que zero');
      return;
    }

    if (formData.type === 'transfer' && (!formData.fromStoreId || !formData.toStoreId)) {
      toast.error('Selecione as lojas de origem e destino para transferência');
      return;
    }

    if ((formData.type === 'in' || formData.type === 'out') && !formData.toStoreId) {
      toast.error('Selecione uma loja');
      return;
    }

    try {
      // Create movement record
      const movement = {
        productId,
        quantity: formData.quantity,
        status: 'delivered' as const,
        createdAt: new Date(),
        userId: 'current-user',
        type: formData.type,
        ...(formData.fromStoreId && { fromStoreId: formData.fromStoreId }),
        ...(formData.toStoreId && { toStoreId: formData.toStoreId })
      };

      addMovement(movement);

      // Update inventory quantities
      if (formData.type === 'in') {
        // Find or create inventory item for the store
        const inventoryItem = inventory.find(i => i.productId === productId && i.storeId === formData.toStoreId);
        if (inventoryItem) {
          updateInventoryItem(inventoryItem.id, {
            currentQuantity: inventoryItem.currentQuantity + formData.quantity
          });
        }
      } else if (formData.type === 'out') {
        // Decrease inventory
        const inventoryItem = inventory.find(i => i.productId === productId && i.storeId === formData.toStoreId);
        if (inventoryItem) {
          const newQuantity = Math.max(0, inventoryItem.currentQuantity - formData.quantity);
          updateInventoryItem(inventoryItem.id, {
            currentQuantity: newQuantity
          });
        }
      } else if (formData.type === 'transfer') {
        // Decrease from source store
        const fromInventory = inventory.find(i => i.productId === productId && i.storeId === formData.fromStoreId);
        if (fromInventory) {
          const newFromQuantity = Math.max(0, fromInventory.currentQuantity - formData.quantity);
          updateInventoryItem(fromInventory.id, {
            currentQuantity: newFromQuantity
          });
        }

        // Increase to destination store
        const toInventory = inventory.find(i => i.productId === productId && i.storeId === formData.toStoreId);
        if (toInventory) {
          updateInventoryItem(toInventory.id, {
            currentQuantity: toInventory.currentQuantity + formData.quantity
          });
        }
      }

      toast.success('Movimentação registrada com sucesso!');
      onClose();
    } catch (error) {
      toast.error('Erro ao registrar movimentação');
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Movimentação</DialogTitle>
          <p className="text-sm text-gray-600">Produto: {product?.name}</p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Movimentação</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value: 'in' | 'out' | 'transfer') => handleInputChange('type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in">Entrada</SelectItem>
                <SelectItem value="out">Saída</SelectItem>
                <SelectItem value="transfer">Transferência</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade</Label>
            <Input
              id="quantity"
              type="number"
              value={formData.quantity}
              onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
              placeholder="Digite a quantidade"
              required
            />
          </div>

          {formData.type === 'transfer' && (
            <div className="space-y-2">
              <Label htmlFor="fromStore">Loja de Origem</Label>
              <Select 
                value={formData.fromStoreId} 
                onValueChange={(value) => handleInputChange('fromStoreId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a loja de origem" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="toStore">
              {formData.type === 'transfer' ? 'Loja de Destino' : 'Loja'}
            </Label>
            <Select 
              value={formData.toStoreId} 
              onValueChange={(value) => handleInputChange('toStoreId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Selecione a ${formData.type === 'transfer' ? 'loja de destino' : 'loja'}`} />
              </SelectTrigger>
              <SelectContent>
                {stores.map((store) => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (Opcional)</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Digite uma descrição"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Registrar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InventoryMovementForm;
