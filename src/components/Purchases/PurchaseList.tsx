
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Package, Eye, Filter } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { PurchaseDistributionModal } from './PurchaseDistributionModal';
import { PurchaseOrderModal } from './PurchaseOrderModal';

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

const PurchaseList: React.FC = () => {
  const { t } = useLanguage();
  const { 
    inventory, 
    products, 
    suppliers, 
    stores,
    getProductById, 
    getSupplierById, 
    getStoreById,
    getLowStockItems 
  } = useData();
  
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [selectedStores, setSelectedStores] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [distributionModal, setDistributionModal] = useState<{isOpen: boolean, product?: PurchaseItem}>({isOpen: false});
  const [orderModal, setOrderModal] = useState<{isOpen: boolean, items: PurchaseItem[]}>({isOpen: false, items: []});
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);

  React.useEffect(() => {
    generatePurchaseItems();
  }, [selectedSupplier, selectedStores, inventory, products]);

  const generatePurchaseItems = () => {
    const lowStockItems = getLowStockItems();
    const itemsMap = new Map<string, PurchaseItem>();

    lowStockItems.forEach(item => {
      const product = getProductById(item.productId);
      const store = getStoreById(item.storeId);
      const supplier = product ? getSupplierById(product.supplierId) : null;

      if (!product || !store || !supplier) return;

      // Filtros
      if (selectedSupplier !== 'all' && supplier.id !== selectedSupplier) return;
      if (selectedStores !== 'all' && store.id !== selectedStores) return;

      const key = `${product.id}-${supplier.id}`;
      
      if (!itemsMap.has(key)) {
        itemsMap.set(key, {
          productId: product.id,
          productName: product.name,
          productCode: product.sku,
          currentStock: 0,
          minStock: 0,
          idealStock: 0,
          suggested: 0,
          order: 0,
          stores: []
        });
      }

      const purchaseItem = itemsMap.get(key)!;
      const idealStock = item.minQuantity * 2;
      const suggestedQuantity = Math.max(idealStock - item.currentQuantity, 0);

      purchaseItem.stores.push({
        storeId: store.id,
        storeName: store.name,
        currentStock: item.currentQuantity,
        minStock: item.minQuantity,
        idealStock: idealStock,
        quantity: 0
      });

      purchaseItem.currentStock += item.currentQuantity;
      purchaseItem.minStock += item.minQuantity;
      purchaseItem.idealStock += idealStock;
      purchaseItem.suggested += suggestedQuantity;
    });

    const items = Array.from(itemsMap.values());
    
    // Aplicar filtro de status
    let filteredItems = items;
    if (statusFilter === 'critical') {
      filteredItems = items.filter(item => item.currentStock < item.minStock * 0.5);
    } else if (statusFilter === 'warning') {
      filteredItems = items.filter(item => 
        item.currentStock >= item.minStock * 0.5 && item.currentStock < item.idealStock
      );
    } else if (statusFilter === 'normal') {
      filteredItems = items.filter(item => item.currentStock >= item.idealStock);
    }

    setPurchaseItems(filteredItems);
  };

  const getStockStatus = (current: number, min: number, ideal: number) => {
    if (current < min * 0.5) return { status: 'critical', icon: '❌', color: 'text-red-600' };
    if (current < ideal) return { status: 'warning', icon: '⚠️', color: 'text-yellow-600' };
    return { status: 'normal', icon: '✅', color: 'text-green-600' };
  };

  const handleOrderChange = (productId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setPurchaseItems(prev => 
      prev.map(item => 
        item.productId === productId 
          ? { ...item, order: numValue }
          : item
      )
    );
  };

  const openDistributionModal = (item: PurchaseItem) => {
    setDistributionModal({ isOpen: true, product: item });
  };

  const generateOrder = () => {
    const itemsWithOrder = purchaseItems.filter(item => item.order > 0);
    setOrderModal({ isOpen: true, items: itemsWithOrder });
  };

  const totalOrderItems = purchaseItems.reduce((sum, item) => sum + item.order, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('purchases.title')}</h1>
          <p className="text-gray-600 mt-2">{t('purchases.description')}</p>
        </div>
        
        {totalOrderItems > 0 && (
          <Button onClick={generateOrder} className="bg-blue-600 hover:bg-blue-700">
            <Package className="h-4 w-4 mr-2" />
            Gerar Pedido ({totalOrderItems} itens)
          </Button>
        )}
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-48">
              <label className="text-sm font-medium">Fornecedor</label>
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">Todos os fornecedores</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-48">
              <label className="text-sm font-medium">Lojas</label>
              <select
                value={selectedStores}
                onChange={(e) => setSelectedStores(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">Todas as lojas</option>
                {stores.map(store => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-48">
              <label className="text-sm font-medium">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">Todos os status</option>
                <option value="critical">Crítico</option>
                <option value="warning">Atenção</option>
                <option value="normal">Normal</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Produtos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Sugestões de Compra
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Estoque Atual</TableHead>
                  <TableHead>Min</TableHead>
                  <TableHead>Ideal</TableHead>
                  <TableHead>Sugestão</TableHead>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseItems.map((item) => {
                  const stockStatus = getStockStatus(item.currentStock, item.minStock, item.idealStock);
                  
                  return (
                    <TableRow key={item.productId}>
                      <TableCell className="font-mono text-sm">
                        {item.productCode}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={stockStatus.color}>{stockStatus.icon}</span>
                          <span className="font-medium">{item.productName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={stockStatus.color + ' font-semibold'}>
                          {item.currentStock}
                        </span>
                      </TableCell>
                      <TableCell>{item.minStock}</TableCell>
                      <TableCell>{item.idealStock}</TableCell>
                      <TableCell className="font-semibold text-blue-600">
                        {item.suggested}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={item.order || ''}
                          onChange={(e) => handleOrderChange(item.productId, e.target.value)}
                          className="w-20"
                          placeholder="0"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDistributionModal(item)}
                            title="Distribuir por loja"
                          >
                            <ShoppingCart className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            title="Ver detalhes por loja"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          
          {purchaseItems.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum item encontrado com os filtros selecionados</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modais */}
      <PurchaseDistributionModal 
        isOpen={distributionModal.isOpen}
        product={distributionModal.product}
        onClose={() => setDistributionModal({isOpen: false})}
        onConfirm={(productId, distributions) => {
          // Atualizar as quantidades por loja
          setPurchaseItems(prev => 
            prev.map(item => {
              if (item.productId === productId) {
                const totalQuantity = distributions.reduce((sum, d) => sum + d.quantity, 0);
                return {
                  ...item,
                  order: totalQuantity,
                  stores: item.stores.map(store => {
                    const dist = distributions.find(d => d.storeId === store.storeId);
                    return { ...store, quantity: dist?.quantity || 0 };
                  })
                };
              }
              return item;
            })
          );
          setDistributionModal({isOpen: false});
        }}
      />

      <PurchaseOrderModal
        isOpen={orderModal.isOpen}
        items={orderModal.items}
        onClose={() => setOrderModal({isOpen: false, items: []})}
      />
    </div>
  );
};

export default PurchaseList;
