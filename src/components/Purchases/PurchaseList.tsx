
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ShoppingCart, Package, Filter, Store, Check, X, FileText } from 'lucide-react';
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
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [distributionModal, setDistributionModal] = useState<{ isOpen: boolean, product?: PurchaseItem }>({ isOpen: false });
  const [orderModal, setOrderModal] = useState<{ isOpen: boolean, items: PurchaseItem[] }>({ isOpen: false, items: [] });
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);

  const toggleStore = (storeId: string) => {
    setSelectedStoreIds(prev =>
      prev.includes(storeId)
        ? prev.filter(id => id !== storeId)
        : [...prev, storeId]
    );
  };

  React.useEffect(() => {
    generatePurchaseItems();
  }, [selectedSupplier, selectedStoreIds, statusFilter, inventory, products]);

  const generatePurchaseItems = () => {
    const lowStockItems = getLowStockItems();
    const itemsMap = new Map<string, PurchaseItem>();

    lowStockItems.forEach(item => {
      const product = getProductById(item.productId);
      const store = getStoreById(item.storeId);
      const supplier = product ? getSupplierById(product.supplierId) : null;

      if (!product || !store || !supplier) return;

      // Supplier filter
      if (selectedSupplier !== 'all' && supplier.id !== selectedSupplier) return;

      // Multi-store filter
      if (selectedStoreIds.length > 0 && !selectedStoreIds.includes(store.id)) return;

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
          unit: product.unit || 'UN',
          stores: []
        });
      }

      const purchaseItem = itemsMap.get(key)!;
      // Use alertWarning as ideal if available, otherwise minQuantity * 2
      const idealStock = item.alertWarning || item.minQuantity * 2;
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

    // Status filter
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
    if (current < min * 0.5) return { status: 'critical', color: 'bg-red-500', textColor: 'text-red-600' };
    if (current < ideal) return { status: 'warning', color: 'bg-amber-500', textColor: 'text-amber-600' };
    return { status: 'normal', color: 'bg-emerald-500', textColor: 'text-emerald-600' };
  };

  // Get all inventory for a product across all stores (for tooltip)
  const getProductInventoryByStore = (productId: string) => {
    return inventory
      .filter((inv: any) => inv.productId === productId)
      .map((inv: any) => {
        const store = getStoreById(inv.storeId);
        return {
          storeName: store?.name || 'Unknown',
          currentStock: inv.currentQuantity,
          minStock: inv.minQuantity
        };
      })
      .sort((a, b) => a.storeName.localeCompare(b.storeName));
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

  const storeLabel = selectedStoreIds.length === 0
    ? t('purchases.allStores')
    : selectedStoreIds.length === 1
      ? stores.find((s: any) => s.id === selectedStoreIds[0])?.name || ''
      : `${selectedStoreIds.length} ${t('purchases.storesSelected')}`;

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
            {t('purchases.generateOrder')} ({totalOrderItems} itens)
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
            <Filter className="h-4 w-4" />
            {t('transit.filters_title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Supplier */}
            <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
              <SelectTrigger>
                <SelectValue placeholder={t('purchases.allSuppliers')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('purchases.allSuppliers')}</SelectItem>
                {suppliers.map((supplier: any) => (
                  <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Multi-select Stores */}
            <Popover open={storeDropdownOpen} onOpenChange={setStoreDropdownOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between text-left font-normal h-10"
                >
                  <span className="truncate">{storeLabel}</span>
                  <Store className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-2" align="start">
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sm h-8"
                    onClick={() => setSelectedStoreIds([])}
                  >
                    <div className={`w-4 h-4 mr-2 rounded border flex items-center justify-center ${selectedStoreIds.length === 0 ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                      {selectedStoreIds.length === 0 && <Check className="h-3 w-3 text-white" />}
                    </div>
                    {t('purchases.allStores')}
                  </Button>
                  {stores.map((store: any) => (
                    <Button
                      key={store.id}
                      variant="ghost"
                      className="w-full justify-start text-sm h-8"
                      onClick={() => toggleStore(store.id)}
                    >
                      <div className={`w-4 h-4 mr-2 rounded border flex items-center justify-center ${selectedStoreIds.includes(store.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                        {selectedStoreIds.includes(store.id) && <Check className="h-3 w-3 text-white" />}
                      </div>
                      {store.name}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Status */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder={t('purchases.allStatuses')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('purchases.allStatuses')}</SelectItem>
                <SelectItem value="critical">{t('purchases.critical')}</SelectItem>
                <SelectItem value="warning">{t('purchases.warning')}</SelectItem>
                <SelectItem value="normal">{t('purchases.normal')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {t('purchases.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('purchases.code')}</TableHead>
                  <TableHead>{t('common.product')}</TableHead>
                  <TableHead>{t('purchases.unit')}</TableHead>
                  <TableHead>{t('purchases.currentStock')}</TableHead>
                  <TableHead>Min</TableHead>
                  <TableHead>{t('purchases.ideal')}</TableHead>
                  <TableHead>{t('purchases.suggestion')}</TableHead>
                  <TableHead>{t('purchases.orderQty')}</TableHead>
                  <TableHead>{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseItems.map((item) => {
                  const stockStatus = getStockStatus(item.currentStock, item.minStock, item.idealStock);
                  const storeInventory = getProductInventoryByStore(item.productId);

                  return (
                    <TableRow key={item.productId}>
                      <TableCell className="font-mono text-sm text-gray-500">
                        {item.productCode}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{item.productName}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-medium">
                          {item.unit}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {/* Stock with hover tooltip showing per-store breakdown */}
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className={`${stockStatus.textColor} font-semibold cursor-pointer hover:underline flex items-center gap-1.5`}>
                              <span className={`inline-block w-2 h-2 rounded-full ${stockStatus.color}`}></span>
                              {item.currentStock}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 p-0" align="start" side="bottom">
                            <div className="p-3 border-b border-gray-100">
                              <p className="text-sm font-semibold text-gray-800">{item.productName}</p>
                              <p className="text-xs text-gray-500">{t('purchases.stockByStore')}</p>
                            </div>
                            <div className="p-2 space-y-1 max-h-48 overflow-y-auto">
                              {storeInventory.map((inv, idx) => {
                                const invStatus = getStockStatus(inv.currentStock, inv.minStock, inv.minStock * 2);
                                return (
                                  <div key={idx} className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-gray-50 text-sm">
                                    <div className="flex items-center gap-2">
                                      <span className={`inline-block w-2 h-2 rounded-full ${invStatus.color}`}></span>
                                      <span className="text-gray-700">{inv.storeName}:</span>
                                    </div>
                                    <span className="font-semibold text-gray-900">{inv.currentStock}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                      <TableCell>{item.minStock}</TableCell>
                      <TableCell>{item.idealStock}</TableCell>
                      <TableCell className="font-semibold text-blue-600">
                        {item.suggested}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center justify-center w-12 h-8 rounded-md text-sm font-semibold ${item.order > 0 ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-gray-50 text-gray-400 border border-gray-200'
                          }`}>
                          {item.order}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDistributionModal(item)}
                          title={t('purchases.distributeByStore')}
                        >
                          <ShoppingCart className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {purchaseItems.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">{t('purchases.noItems')}</h3>
              <p className="text-gray-500 text-sm">{t('purchases.noItemsDescription')}</p>
            </div>
          )}

          {/* Generate Order button below the list */}
          {purchaseItems.length > 0 && (
            <div className="flex justify-end pt-4 mt-4 border-t">
              <Button
                onClick={generateOrder}
                disabled={totalOrderItems === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <FileText className="h-4 w-4 mr-2" />
                {t('purchases.generateOrder')} {totalOrderItems > 0 ? `(${totalOrderItems} itens)` : ''}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <PurchaseDistributionModal
        isOpen={distributionModal.isOpen}
        product={distributionModal.product}
        onClose={() => setDistributionModal({ isOpen: false })}
        onConfirm={(productId, distributions) => {
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
          setDistributionModal({ isOpen: false });
        }}
      />

      <PurchaseOrderModal
        isOpen={orderModal.isOpen}
        items={orderModal.items}
        onClose={() => setOrderModal({ isOpen: false, items: [] })}
      />
    </div>
  );
};

export default PurchaseList;
