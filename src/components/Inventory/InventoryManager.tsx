
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import {
  Search, Plus, Edit, Truck, ShoppingCart, Package,
  LayoutList, LayoutGrid
} from 'lucide-react';
import ProductForm from './ProductForm';
import InventoryMovementForm from './InventoryMovementForm';
import InventoryCardView from './InventoryCardView';
import StockPopup from './StockPopup';
import { TransitForm } from '@/components/Transit/TransitForm';

type StockFilter = 'all' | 'normal' | 'low' | 'critical';
type ViewMode = 'list' | 'card';

const InventoryManager: React.FC = () => {
  const { t } = useLanguage();
  const {
    products,
    inventory,
    stores,
    categories,
    suppliers,
    movements,
    getProductById,
    getStoreById,
    getCategoryById,
    getSupplierById
  } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [showProductForm, setShowProductForm] = useState(false);
  const [showMovementForm, setShowMovementForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTransitMovement, setSelectedTransitMovement] = useState<any>(null);
  const [showTransitDetail, setShowTransitDetail] = useState(false);
  const [stockPopupData, setStockPopupData] = useState<{
    product: any; store: any; item: any; category?: any;
  } | null>(null);

  // Group inventory by product
  const productGroups = useMemo(() => {
    return products.map(product => {
      const productInventory = inventory.filter(i => i.productId === product.id);
      const storeItems = productInventory
        .map(item => {
          const store = getStoreById(item.storeId);
          return store ? { store, item } : null;
        })
        .filter(Boolean) as Array<{ store: any; item: any }>;

      // If store filter is active, check if this product exists in that store
      if (selectedStore !== 'all') {
        const hasStore = storeItems.some(si => si.store.id === selectedStore);
        if (!hasStore) return null;
      }

      const totalQuantity = productInventory.reduce((sum, i) => sum + i.currentQuantity, 0);
      const totalMinQuantity = productInventory.reduce((sum, i) => sum + i.minQuantity, 0);
      const supplier = getSupplierById(product.supplierId);
      const category = getCategoryById(product.categoryId);

      // Determine stock status
      const avgRatio = totalMinQuantity > 0 ? totalQuantity / totalMinQuantity : 1;
      let stockStatus: 'normal' | 'low' | 'critical' = 'normal';
      if (avgRatio <= 0.5) stockStatus = 'critical';
      else if (avgRatio <= 1) stockStatus = 'low';

      // Get in-transit movements for this product
      const inTransitMovements = movements
        .filter(m => m.productId === product.id && (m.status === 'in_transit' || m.status === 'pending'))
        .map(m => ({
          ...m,
          toStoreName: m.toStoreId ? getStoreById(m.toStoreId)?.name : undefined
        }));

      return {
        product,
        storeItems: selectedStore !== 'all'
          ? storeItems.filter(si => si.store.id === selectedStore)
          : storeItems,
        totalQuantity,
        supplier,
        category,
        inTransitMovements,
        stockStatus
      };
    }).filter(Boolean) as Array<{
      product: any;
      storeItems: any[];
      totalQuantity: number;
      supplier: any;
      category: any;
      inTransitMovements: any[];
      stockStatus: 'normal' | 'low' | 'critical';
    }>;
  }, [products, inventory, movements, selectedStore, getStoreById, getSupplierById, getCategoryById]);

  // Apply filters
  const filteredGroups = useMemo(() => {
    return productGroups.filter(group => {
      const matchesSearch = !searchTerm ||
        group.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.product.sku.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = selectedCategory === 'all' || group.product.categoryId === selectedCategory;
      const matchesSupplier = selectedSupplier === 'all' || group.product.supplierId === selectedSupplier;
      const matchesStock = stockFilter === 'all' || group.stockStatus === stockFilter;

      return matchesSearch && matchesCategory && matchesSupplier && matchesStock;
    });
  }, [productGroups, searchTerm, selectedCategory, selectedSupplier, stockFilter]);

  // Group filtered results by category for display
  const groupedByCategory = useMemo(() => {
    const groups: Record<string, typeof filteredGroups> = {};
    filteredGroups.forEach(group => {
      const catName = group.category?.name || 'Sem Categoria';
      if (!groups[catName]) groups[catName] = [];
      groups[catName].push(group);
    });
    return groups;
  }, [filteredGroups]);

  const handleEditProduct = (productId: string) => {
    setSelectedProduct(productId);
    setShowProductForm(true);
  };

  const handleAddMovement = (productId: string) => {
    setSelectedProduct(productId);
    setShowMovementForm(true);
  };

  const getStockDotClass = (filter: StockFilter, active: boolean) => {
    const colors: Record<StockFilter, string> = {
      all: 'bg-gray-400',
      normal: 'bg-emerald-500',
      low: 'bg-amber-500',
      critical: 'bg-red-500',
    };
    return `w-5 h-5 rounded-full cursor-pointer transition-all ${colors[filter]} ${active ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'opacity-60 hover:opacity-100'}`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('inventory.title')}</h1>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              className={`h-8 px-3 ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'card' ? 'default' : 'ghost'}
              size="sm"
              className={`h-8 px-3 ${viewMode === 'card' ? 'bg-white shadow-sm' : ''}`}
              onClick={() => setViewMode('card')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => setShowProductForm(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            {t('inventory.addProduct')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            {/* Row 1: Category + Status Dots + Add button */}
            <div className="flex items-center gap-3 flex-wrap">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder={t('inventory.filterByCategory')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('inventory.allCategories')}</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Stock Status Dots */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStockFilter(stockFilter === 'normal' ? 'all' : 'normal')}
                  className={getStockDotClass('normal', stockFilter === 'normal')}
                  title={t('inventory.stockStatus.normal')}
                />
                <button
                  onClick={() => setStockFilter(stockFilter === 'low' ? 'all' : 'low')}
                  className={getStockDotClass('low', stockFilter === 'low')}
                  title={t('inventory.stockStatus.low')}
                />
                <button
                  onClick={() => setStockFilter(stockFilter === 'critical' ? 'all' : 'critical')}
                  className={getStockDotClass('critical', stockFilter === 'critical')}
                  title={t('inventory.stockStatus.critical')}
                />
              </div>
            </div>

            {/* Row 2: Supplier + Store */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                <SelectTrigger>
                  <SelectValue placeholder={t('inventory.filterBySupplier')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('inventory.allSuppliers')}</SelectItem>
                  {suppliers.map(supplier => (
                    <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStore} onValueChange={setSelectedStore}>
                <SelectTrigger>
                  <SelectValue placeholder={t('inventory.filterByStore')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('inventory.allStores')}</SelectItem>
                  {stores.map(store => (
                    <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Row 3: Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={t('inventory.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {viewMode === 'card' ? (
        <InventoryCardView
          productGroups={filteredGroups}
          onEditProduct={handleEditProduct}
          onAddMovement={handleAddMovement}
          onTransitClick={(movement) => {
            setSelectedTransitMovement(movement);
            setShowTransitDetail(true);
          }}
        />
      ) : (
        /* List View - Product-Centric */
        Object.entries(groupedByCategory).map(([categoryName, groups]) => (
          <div key={categoryName} className="space-y-3">
            <h2 className="text-lg font-bold text-gray-700 uppercase tracking-wide text-center">
              {categoryName === 'Sem Categoria' ? t('inventory.noCategory') : categoryName}
            </h2>
            <div className="space-y-2">
              {groups.map((group) => (
                <Card key={group.product.id} className="overflow-hidden transition-shadow hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Product Info (left side) */}
                      <div className="flex items-center gap-3 lg:w-48 flex-shrink-0">
                        {/* Image/Placeholder */}
                        <div className="relative w-16 h-16 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center flex-shrink-0 overflow-hidden border border-slate-200">
                          {group.product.imageUrl ? (
                            <img src={group.product.imageUrl} alt={group.product.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="h-7 w-7 text-slate-400" />
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-0.5 font-semibold">
                            {t('inventory.total')}: {group.totalQuantity}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm text-gray-900 leading-tight">{group.product.name}</h3>
                          <p className="text-xs text-gray-500">{group.product.sku}</p>
                        </div>
                      </div>

                      {/* Store Quantity Circles */}
                      <div className="flex flex-wrap gap-3 flex-1 justify-center lg:justify-start">
                        {group.storeItems.map(({ store, item }: { store: any; item: any }) => {
                          const warningThreshold = item.alertWarning ?? item.minQuantity;
                          const criticalThreshold = item.alertCritical ?? Math.floor(item.minQuantity * 0.5);
                          const isCritical = item.currentQuantity <= criticalThreshold;
                          const isLow = item.currentQuantity <= warningThreshold;
                          const circleColor = isCritical ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500';
                          return (
                            <div key={store.id} className="flex flex-col items-center">
                              <div
                                className={`w-10 h-10 ${circleColor} rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm cursor-pointer hover:scale-110 hover:shadow-md transition-all active:scale-95`}
                                onClick={() => setStockPopupData({ product: group.product, store, item, category: group.category })}
                              >
                                {item.currentQuantity}
                              </div>
                              <span className="text-[10px] text-gray-500 mt-1 max-w-[60px] text-center truncate">{store.name}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Badges: Unit + Supplier */}
                      <div className="flex items-center gap-2 flex-wrap lg:w-auto flex-shrink-0">
                        {group.product.unit && (
                          <Badge variant="secondary" className="text-xs gap-1 bg-slate-100 text-slate-600">
                            <Package className="h-3 w-3" />
                            1 {group.product.unit}
                          </Badge>
                        )}
                        {group.supplier && (
                          <Badge variant="secondary" className="text-xs gap-1 bg-orange-50 text-orange-700 border-orange-200">
                            <ShoppingCart className="h-3 w-3" />
                            {group.supplier.name}
                          </Badge>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => handleEditProduct(group.product.id)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleAddMovement(group.product.id)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* In-Transit Row */}
                    {group.inTransitMovements.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3 pt-2 border-t border-gray-100">
                        {group.inTransitMovements.map((movement: any) => (
                          <Badge
                            key={movement.id}
                            variant="secondary"
                            className="text-[11px] gap-1 bg-emerald-50 text-emerald-700 border-emerald-200 cursor-pointer hover:bg-emerald-100 transition-colors"
                            onClick={() => {
                              setSelectedTransitMovement(movement);
                              setShowTransitDetail(true);
                            }}
                          >
                            <Truck className="h-3 w-3" />
                            +{movement.quantity} para {movement.toStoreName}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}

      {filteredGroups.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">{t('inventory.noProductsFilters')}</p>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      {showProductForm && (
        <ProductForm
          productId={selectedProduct}
          onClose={() => {
            setShowProductForm(false);
            setSelectedProduct(null);
          }}
        />
      )}

      {showMovementForm && selectedProduct && (
        <InventoryMovementForm
          productId={selectedProduct}
          onClose={() => {
            setShowMovementForm(false);
            setSelectedProduct(null);
          }}
        />
      )}

      {/* Transit Detail Dialog */}
      <Dialog open={showTransitDetail} onOpenChange={setShowTransitDetail}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {t('transit.view_transfer')}
            </DialogTitle>
          </DialogHeader>
          <TransitForm
            movement={selectedTransitMovement}
            onClose={() => {
              setShowTransitDetail(false);
              setSelectedTransitMovement(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Stock Popup */}
      {stockPopupData && (
        <StockPopup
          product={stockPopupData.product}
          store={stockPopupData.store}
          item={stockPopupData.item}
          category={stockPopupData.category}
          onClose={() => setStockPopupData(null)}
          onEditProduct={(id) => {
            setStockPopupData(null);
            handleEditProduct(id);
          }}
          onTransferProduct={(id) => {
            setStockPopupData(null);
            // Could navigate to transit or open transit form
          }}
        />
      )}
    </div>
  );
};

export default InventoryManager;
