
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Check } from 'lucide-react';

interface PurchaseItem {
  productId: string;
  productName: string;
  productCode: string;
  currentStock: number;
  minStock: number;
  idealStock: number;
  suggested: number;
  order: number;
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

  const getStockStatus = (current: number, min: number, ideal: number) => {
    if (current < min * 0.5) return { color: 'text-red-600', icon: '❌' };
    if (current < ideal) return { color: 'text-yellow-600', icon: '⚠️' };
    return { color: 'text-green-600', icon: '✅' };
  };

  const isValid = totalQuantity <= (product?.suggested || 0);

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div>
              <span>Distribuir por Loja</span>
              <div className="text-sm text-gray-600 font-normal mt-1">
                {product.productName} ({product.productCode})
              </div>
            </div>
            <Badge variant="outline" className="text-lg">
              Total Sugerido: {product.suggested}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Botões de Distribuição Automática */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={distributeEvenly}
            >
              Distribuir Igualmente
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={distributeBySuggestion}
            >
              Por Necessidade da Loja
            </Button>
          </div>

          {/* Tabela de Distribuição */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loja</TableHead>
                  <TableHead>Estoque Atual</TableHead>
                  <TableHead>Min</TableHead>
                  <TableHead>Ideal</TableHead>
                  <TableHead>Necessário</TableHead>
                  <TableHead>Quantidade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {product.stores.map((store) => {
                  const distribution = distributions.find(d => d.storeId === store.storeId);
                  const needed = Math.max(store.idealStock - store.currentStock, 0);
                  const stockStatus = getStockStatus(store.currentStock, store.minStock, store.idealStock);
                  
                  return (
                    <TableRow key={store.storeId}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={stockStatus.color}>{stockStatus.icon}</span>
                          <span className="font-medium">{store.storeName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={stockStatus.color + ' font-semibold'}>
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
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Resumo */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <span className="font-medium">
                  Total a Pedir: <span className="text-lg">{totalQuantity}</span>
                </span>
                <span className="text-gray-600">
                  de {product.suggested} sugeridos
                </span>
              </div>
              
              {!isValid && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">Quantidade excede o sugerido</span>
                </div>
              )}
              
              {isValid && totalQuantity > 0 && (
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="h-4 w-4" />
                  <span className="text-sm">Distribuição válida</span>
                </div>
              )}
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={!isValid || totalQuantity === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Confirmar Distribuição
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
