
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { Package, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StockWithdrawalFormProps {
  productId: string;
  storeId?: string;
  onClose: () => void;
}

const StockWithdrawalForm: React.FC<StockWithdrawalFormProps> = ({
  productId,
  storeId,
  onClose
}) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const {
    getProductById,
    getCategoryById,
    getStoreById,
    stores,
    inventory,
    updateInventoryItem,
    addOperationLog,
    getOperationLogsByProduct
  } = useData();

  const [formData, setFormData] = useState({
    storeId: storeId || '',
    quantity: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const product = getProductById(productId);
  const category = getCategoryById(product?.categoryId || '');
  
  // Obter estoque disponível
  const availableStock = inventory.find(item => 
    item.productId === productId && 
    item.storeId === formData.storeId
  );

  const recentLogs = getOperationLogsByProduct(productId).slice(0, 5);

  useEffect(() => {
    if (storeId) {
      setFormData(prev => ({ ...prev, storeId }));
    }
  }, [storeId]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.storeId) {
      toast({
        title: t('operations.error'),
        description: t('operations.selectStoreRequired'),
        variant: 'destructive'
      });
      return false;
    }

    const quantity = parseInt(formData.quantity);
    if (!quantity || quantity <= 0) {
      toast({
        title: t('operations.error'),
        description: t('operations.invalidQuantity'),
        variant: 'destructive'
      });
      return false;
    }

    if (!availableStock || quantity > availableStock.currentQuantity) {
      toast({
        title: t('operations.error'),
        description: t('operations.insufficientStock'),
        variant: 'destructive'
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const quantity = parseInt(formData.quantity);
      
      // Atualizar estoque
      if (availableStock) {
        updateInventoryItem(availableStock.id, {
          currentQuantity: availableStock.currentQuantity - quantity
        });
      }
      
      // Registrar operação
      addOperationLog({
        productId,
        storeId: formData.storeId,
        userId: 'current-user', // Em um sistema real, viria do contexto de autenticação
        quantity,
        actionType: 'withdrawal',
        createdAt: new Date(),
        notes: formData.notes || undefined
      });

      // Verificar se ficou abaixo do estoque mínimo
      const newQuantity = availableStock.currentQuantity - quantity;
      if (newQuantity <= availableStock.minQuantity) {
        toast({
          title: t('operations.lowStockAlert'),
          description: `${product?.name} ${t('operations.belowMinimumStock')}`,
          variant: 'destructive'
        });
      }

      toast({
        title: t('operations.success'),
        description: t('operations.withdrawalCompleted'),
        variant: 'default'
      });

      onClose();
    } catch (error) {
      toast({
        title: t('operations.error'),
        description: t('operations.withdrawalFailed'),
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!product) {
    return null;
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {t('operations.withdrawStock')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações do Produto */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('operations.productInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('operations.productName')}</Label>
                  <p className="font-medium">{product.name}</p>
                </div>
                <div>
                  <Label>{t('operations.category')}</Label>
                  <p className="text-gray-600">{category?.name}</p>
                </div>
                <div>
                  <Label>{t('operations.sku')}</Label>
                  <p className="text-gray-600">{product.sku}</p>
                </div>
                <div>
                  <Label>{t('operations.sellingPrice')}</Label>
                  <p className="text-gray-600">R$ {product.sellingPrice.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Formulário de Retirada */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="storeId">{t('operations.store')} *</Label>
              <Select 
                value={formData.storeId} 
                onValueChange={(value) => handleInputChange('storeId', value)}
                disabled={!!storeId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('operations.selectStore')} />
                </SelectTrigger>
                <SelectContent>
                  {stores.map(store => (
                    <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.storeId && availableStock && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t('operations.currentStock')}:</span>
                  <Badge variant={availableStock.currentQuantity <= availableStock.minQuantity ? 'destructive' : 'default'}>
                    {availableStock.currentQuantity} {t('operations.units')}
                  </Badge>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-gray-600">{t('operations.minimumStock')}:</span>
                  <span className="text-sm">{availableStock.minQuantity} {t('operations.units')}</span>
                </div>
                {availableStock.currentQuantity <= availableStock.minQuantity && (
                  <div className="flex items-center gap-2 mt-2 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">{t('operations.lowStockWarning')}</span>
                  </div>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="quantity">{t('operations.quantityToWithdraw')} *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={availableStock?.currentQuantity || 0}
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', e.target.value)}
                placeholder={t('operations.enterQuantity')}
                disabled={!formData.storeId || !availableStock}
              />
              {formData.quantity && availableStock && (
                <p className="text-sm text-gray-600 mt-1">
                  {t('operations.remainingAfterWithdrawal')}: {availableStock.currentQuantity - parseInt(formData.quantity || '0')} {t('operations.units')}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="notes">{t('operations.notes')} ({t('operations.optional')})</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder={t('operations.addNotes')}
                rows={3}
              />
            </div>
          </div>

          {/* Histórico Recente */}
          {recentLogs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('operations.recentMovements')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recentLogs.map((log) => {
                    const store = getStoreById(log.storeId);
                    return (
                      <div key={log.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {log.actionType === 'withdrawal' ? (
                            <Badge variant="destructive">-{log.quantity}</Badge>
                          ) : (
                            <Badge variant="default">+{log.quantity}</Badge>
                          )}
                          <span>{store?.name}</span>
                        </div>
                        <span className="text-gray-500">
                          {log.createdAt.toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('operations.cancel')}
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !formData.storeId || !formData.quantity}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? t('operations.processing') : t('operations.confirmWithdrawal')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StockWithdrawalForm;
