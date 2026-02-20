
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Check, Package } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface PurchaseItem {
  productId: string;
  productName: string;
  productCode: string;
  currentStock: number;
  minStock: number;
  idealStock: number;
  suggested: number;
  order: number;
  unit: string;
  stores: Array<{
    storeId: string;
    storeName: string;
    currentStock: number;
    minStock: number;
    idealStock: number;
    quantity: number;
  }>;
}

interface StoreDistribution {
  storeId: string;
  quantity: number;
}

interface PurchaseDistributionModalProps {
  isOpen: boolean;
  product?: PurchaseItem;
  onClose: () => void;
  onConfirm: (productId: string, distributions: StoreDistribution[]) => void;
}

export const PurchaseDistributionModal: React.FC<PurchaseDistributionModalProps> = ({
  isOpen,
  product,
  onClose,
  onConfirm
}) => {
  const { t } = useLanguage();
  const { getProductById } = useData();
  const [distributions, setDistributions] = useState<StoreDistribution[]>([]);
  const [totalQuantity, setTotalQuantity] = useState(0);

  useEffect(() => {
    if (product) {
      const initialDistributions = product.stores.map(store => ({
        storeId: store.storeId,
        quantity: store.quantity || 0
      }));
      setDistributions(initialDistributions);
      updateTotal(initialDistributions);
    }
  }, [product]);

  const updateTotal = (dists: StoreDistribution[]) => {
    const total = dists.reduce((sum, dist) => sum + dist.quantity, 0);
    setTotalQuantity(total);
  };

  const handleQuantityChange = (storeId: string, value: string) => {
    const quantity = parseInt(value) || 0;
    const newDistributions = distributions.map(dist =>
      dist.storeId === storeId ? { ...dist, quantity } : dist
    );
    setDistributions(newDistributions);
    updateTotal(newDistributions);
  };

  const distributeEvenly = () => {
    if (!product) return;

    const totalStores = product.stores.length;
    const baseQuantity = Math.floor(product.suggested / totalStores);
    const remainder = product.suggested % totalStores;

    const newDistributions = product.stores.map((store, index) => ({
      storeId: store.storeId,
      quantity: baseQuantity + (index < remainder ? 1 : 0)
    }));

    setDistributions(newDistributions);
    updateTotal(newDistributions);
  };

  const distributeBySuggestion = () => {
    if (!product) return;

    const newDistributions = product.stores.map(store => {
      const suggestedForStore = Math.max(store.idealStock - store.currentStock, 0);
      return {
        storeId: store.storeId,
        quantity: suggestedForStore
      };
    });

    setDistributions(newDistributions);
    updateTotal(newDistributions);
  };

  const handleConfirm = () => {
    if (product) {
      onConfirm(product.productId, distributions);
    }
  };

  const getStockStatusDot = (current: number, min: number, ideal: number) => {
    if (current < min * 0.5) return 'bg-red-500';
    if (current < ideal) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const isValid = totalQuantity <= (product?.suggested || 0);

  if (!product) return null;

  // Get product details for image/sku display
  const fullProduct = getProductById(product.productId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{t('purchases.distributeByStore')}</span>
            <Badge variant="outline" className="text-lg">
              {t('purchases.totalSuggested')}: {product.suggested}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Product Header with image, name, unit, SKU */}
          <div className="flex items-center gap-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="w-14 h-14 rounded-lg bg-white border border-amber-200 flex items-center justify-center overflow-hidden shrink-0">
              {fullProduct?.imageUrl ? (
                <img src={fullProduct.imageUrl} alt={product.productName} className="w-full h-full object-cover rounded-lg" />
              ) : (
                <Package className="h-7 w-7 text-amber-400" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-gray-900 text-base uppercase leading-tight">{product.productName}</h3>
              <div className="flex items-center gap-3 mt-1">
                <Badge className="bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100 text-xs">
                  {product.unit || 'UN'}
                </Badge>
                {product.productCode && (
                  <span className="text-xs text-gray-500 font-mono">{product.productCode}</span>
                )}
              </div>
            </div>
          </div>

          {/* Auto Distribution Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={distributeEvenly}
            >
              {t('purchases.distributeEvenly')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={distributeBySuggestion}
            >
              {t('purchases.distributeByNeed')}
            </Button>
          </div>

          {/* Distribution Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('purchases.store')}</TableHead>
                  <TableHead>{t('purchases.currentStock')}</TableHead>
                  <TableHead>Min</TableHead>
                  <TableHead>{t('purchases.ideal')}</TableHead>
                  <TableHead>{t('purchases.suggestion')}</TableHead>
                  <TableHead>{t('purchases.quantity')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {product.stores.map((store) => {
                  const distribution = distributions.find(d => d.storeId === store.storeId);
                  const needed = Math.max(store.idealStock - store.currentStock, 0);
                  const dotColor = getStockStatusDot(store.currentStock, store.minStock, store.idealStock);

                  return (
                    <TableRow key={store.storeId}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`inline-block w-2.5 h-2.5 rounded-full ${dotColor}`}></span>
                          <span className="font-medium">{store.storeName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`font-semibold ${store.currentStock < store.minStock * 0.5 ? 'text-red-600' :
                          store.currentStock < store.idealStock ? 'text-amber-600' : 'text-emerald-600'
                          }`}>
                          {store.currentStock}
                        </span>
                      </TableCell>
                      <TableCell>{store.minStock}</TableCell>
                      <TableCell>{store.idealStock}</TableCell>
                      <TableCell>
                        <span className="text-blue-600 font-semibold">
                          {needed}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={distribution?.quantity || ''}
                          onChange={(e) => handleQuantityChange(store.storeId, e.target.value)}
                          className="w-24"
                          placeholder={t('purchases.qtyPlaceholder')}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <span className="font-medium">
                  {t('purchases.totalToOrder')}: <span className="text-lg">{totalQuantity}</span>
                </span>
                <span className="text-gray-600">
                  {t('purchases.ofSuggested').replace('{count}', String(product.suggested))}
                </span>
              </div>

              {!isValid && (
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">{t('purchases.exceedsSuggested')}</span>
                </div>
              )}

              {isValid && totalQuantity > 0 && (
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="h-4 w-4" />
                  <span className="text-sm">{t('purchases.validDistribution')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={totalQuantity === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {t('purchases.confirmDistribution')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
