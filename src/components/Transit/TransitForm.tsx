
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/contexts/DataContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';

interface TransitFormProps {
  movement?: any;
  onClose: () => void;
}

export const TransitForm: React.FC<TransitFormProps> = ({ movement, onClose }) => {
  const { t } = useLanguage();
  const { products, stores, addMovement, updateMovement, getProductById, getStoreById } = useData();
  
  const [formData, setFormData] = useState({
    productId: '',
    fromStoreId: '',
    toStoreId: '',
    quantity: '',
    status: 'pending' as 'pending' | 'in_transit' | 'delivered'
  });

  useEffect(() => {
    if (movement) {
      setFormData({
        productId: movement.productId,
        fromStoreId: movement.fromStoreId || '',
        toStoreId: movement.toStoreId || '',
        quantity: movement.quantity.toString(),
        status: movement.status
      });
    }
  }, [movement]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.fromStoreId === formData.toStoreId) {
      toast({
        title: t('common.error'),
        description: t('transit.same_store_error'),
        variant: 'destructive'
      });
      return;
    }

    const movementData = {
      productId: formData.productId,
      fromStoreId: formData.fromStoreId || undefined,
      toStoreId: formData.toStoreId || undefined,
      quantity: parseInt(formData.quantity),
      status: formData.status,
      type: 'transfer' as const,
      userId: 'current-user', // This would come from auth context
      createdAt: new Date()
    };

    if (movement) {
      updateMovement(movement.id, movementData);
      toast({
        title: t('transit.updated'),
        description: t('transit.movement_updated_successfully'),
      });
    } else {
      addMovement(movementData);
      toast({
        title: t('transit.created'),
        description: t('transit.movement_created_successfully'),
      });
    }
    
    onClose();
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const selectedProduct = formData.productId ? getProductById(formData.productId) : null;
  const fromStore = formData.fromStoreId ? getStoreById(formData.fromStoreId) : null;
  const toStore = formData.toStoreId ? getStoreById(formData.toStoreId) : null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'in_transit': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {movement && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              {t('transit.movement_details')}
              <Badge className={getStatusColor(movement.status)}>
                {t(`transit.${movement.status}`)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">{t('transit.created_at')}:</span>
                <p>{new Date(movement.createdAt).toLocaleString('pt-BR')}</p>
              </div>
              <div>
                <span className="font-medium">{t('transit.movement_id')}:</span>
                <p className="font-mono text-xs">{movement.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('common.product')}
          </label>
          <select
            value={formData.productId}
            onChange={(e) => handleChange('productId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={!!movement}
          >
            <option value="">{t('common.select_product')}</option>
            {products.map(product => (
              <option key={product.id} value={product.id}>
                {product.name} (SKU: {product.sku})
              </option>
            ))}
          </select>
          {selectedProduct && (
            <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
              <p><strong>{t('common.product')}:</strong> {selectedProduct.name}</p>
              <p><strong>SKU:</strong> {selectedProduct.sku}</p>
              <p><strong>{t('inventory.costPrice')}:</strong> R$ {selectedProduct.costPrice.toFixed(2)}</p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('common.quantity')}
          </label>
          <input
            type="number"
            value={formData.quantity}
            onChange={(e) => handleChange('quantity', e.target.value)}
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={!!movement}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('transit.from')}
          </label>
          <select
            value={formData.fromStoreId}
            onChange={(e) => handleChange('fromStoreId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!!movement}
          >
            <option value="">{t('transit.external')}</option>
            {stores.map(store => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('transit.to')}
          </label>
          <select
            value={formData.toStoreId}
            onChange={(e) => handleChange('toStoreId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={!!movement}
          >
            <option value="">{t('common.select_store')}</option>
            {stores.map(store => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
        </div>

        {movement && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('common.status')}
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pending">{t('transit.pending')}</option>
              <option value="in_transit">{t('transit.in_transit')}</option>
              <option value="delivered">{t('transit.delivered')}</option>
            </select>
          </div>
        )}
      </div>

      {formData.fromStoreId && formData.toStoreId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('transit.transfer_summary')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="font-semibold">{fromStore?.name || t('transit.external')}</p>
                <p className="text-sm text-gray-500">{t('transit.origin')}</p>
              </div>
              <div className="flex-1 mx-4">
                <div className="h-0.5 bg-blue-300 relative">
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
                      {formData.quantity} {t('common.units')}
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <p className="font-semibold">{toStore?.name || t('transit.external')}</p>
                <p className="text-sm text-gray-500">{t('transit.destination')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        {!movement && (
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
            {t('transit.create_transfer')}
          </Button>
        )}
        {movement && (
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
            {t('common.update')}
          </Button>
        )}
      </div>
    </form>
  );
};
