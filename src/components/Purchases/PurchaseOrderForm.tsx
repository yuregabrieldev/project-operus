
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';

interface PurchaseOrderFormProps {
  suggestion: any;
  onClose: () => void;
}

export const PurchaseOrderForm: React.FC<PurchaseOrderFormProps> = ({ suggestion, onClose }) => {
  const { t } = useLanguage();
  const [quantity, setQuantity] = useState(suggestion.suggestedQuantity);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    toast({
      title: t('purchases.orderCreated'),
      description: `${t('purchases.orderFor')} ${suggestion.product?.name} - ${quantity} ${t('common.units')}`,
    });
    
    onClose();
  };

  const totalCost = (suggestion.product?.costPrice || 0) * quantity;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('purchases.productDetails')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">{t('common.product')}</label>
              <p className="text-lg font-semibold">{suggestion.product?.name}</p>
              <p className="text-sm text-gray-500">SKU: {suggestion.product?.sku}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">{t('common.supplier')}</label>
              <p className="text-lg">{suggestion.supplier?.name}</p>
              <p className="text-sm text-gray-500">{suggestion.supplier?.email}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">{t('purchases.currentStock')}</label>
              <p className="text-xl font-semibold text-red-600">{suggestion.currentQuantity}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">{t('purchases.minStock')}</label>
              <p className="text-xl font-semibold">{suggestion.minQuantity}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">{t('common.priority')}</label>
              <Badge className={`${
                suggestion.priority === 'high' ? 'bg-red-100 text-red-800' :
                suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {t(`purchases.${suggestion.priority}Priority`)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('purchases.orderDetails')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('purchases.quantity')}
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('common.notes')}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('purchases.orderNotes')}
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium">{t('purchases.totalCost')}</span>
              <span className="text-2xl font-bold text-green-600">
                R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {t('purchases.unitPrice')}: R$ {(suggestion.product?.costPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          {t('purchases.createOrder')}
        </Button>
      </div>
    </form>
  );
};
