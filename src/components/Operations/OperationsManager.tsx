import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Package, Store, Factory } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import WithdrawalPopup from './WithdrawalPopup.tsx';

const OperationsManager: React.FC = () => {
  const { t } = useLanguage();
  const {
    products,
    inventory,
    stores,
    categories,
    getCategoryById
  } = useData();

  const [selectedStoreId, setSelectedStoreId] = useState<string>(stores[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [withdrawalProduct, setWithdrawalProduct] = useState<any>(null);

  // Get products with stock in the selected store
  const storeProducts = useMemo(() => {
    return inventory
      .filter((item: any) => item.storeId === selectedStoreId)
      .map((item: any) => {
        const product = products.find((p: any) => p.id === item.productId);
        if (!product) return null;
        const category = getCategoryById(product.categoryId);
        return { product, item, category };
      })
      .filter(Boolean)
      .filter((entry: any) => {
        if (selectedCategoryId !== 'all' && entry.product.categoryId !== selectedCategoryId) {
          return false;
        }
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
          entry.product.name.toLowerCase().includes(term) ||
          entry.product.sku.toLowerCase().includes(term) ||
          (entry.category?.name || '').toLowerCase().includes(term)
        );
      });
  }, [inventory, products, selectedStoreId, searchTerm, selectedCategoryId, getCategoryById]);

  const selectedStore = stores.find((s: any) => s.id === selectedStoreId);

  return (
    <div className="p-6 space-y-5">
      {/* Store Selector */}
      <div className="flex gap-2 flex-wrap">
        {stores.filter((s: any) => s.isActive).map((store: any) => (
          <button
            key={store.id}
            onClick={() => setSelectedStoreId(store.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${selectedStoreId === store.id
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
          >
            <Store className="h-4 w-4" />
            {store.name}
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('operationsPage.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 rounded-xl border-input text-sm bg-background"
          />
        </div>

        <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
          <SelectTrigger className="w-40 h-11 rounded-xl bg-background border-input">
            <SelectValue placeholder={t('inventory.filterByCategory')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('inventory.allCategories')}</SelectItem>
            {categories.map((category: any) => (
              <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {storeProducts.map((entry: any) => {
          const { product, item, category } = entry;
          const warningThreshold = item.alertWarning ?? item.minQuantity;
          const criticalThreshold = item.alertCritical ?? Math.floor(item.minQuantity * 0.5);
          const isCritical = item.currentQuantity <= criticalThreshold;
          const isLow = item.currentQuantity <= warningThreshold;

          return (
            <button
              key={item.id}
              onClick={() => setWithdrawalProduct({ product, item, store: selectedStore, category })}
              className="group flex flex-col items-center bg-card rounded-2xl border border-border p-4 hover:shadow-lg hover:border-primary/50 hover:scale-[1.02] transition-all duration-200 cursor-pointer active:scale-95 text-center"
            >
              <div className="w-16 h-16 rounded-xl bg-muted/50 flex items-center justify-center mb-3 overflow-hidden border border-border group-hover:border-primary/50 transition-colors">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <Package className="h-7 w-7 text-muted-foreground/50" />
                )}
              </div>

              <p className="text-xs font-semibold text-foreground leading-tight mb-1.5 uppercase line-clamp-2 min-h-[2rem]">
                {product.name}
              </p>

              {category && (
                <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground border-border px-2 py-0 mb-2">
                  {category.name}
                </Badge>
              )}

              <div className={`text-lg font-bold ${isCritical ? 'text-destructive' : isLow ? 'text-orange-500' : 'text-emerald-600'}`}>
                {item.currentQuantity}
              </div>
              <span className="text-[10px] text-muted-foreground uppercase">{product.unit || 'UN.'}</span>
            </button>
          );
        })}
      </div>

      {/* Empty State */}
      {storeProducts.length === 0 && (
        <div className="text-center py-16">
          <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">{t('operationsPage.noProducts')}</p>
        </div>
      )}

      {/* Withdrawal Popup */}
      {withdrawalProduct && (
        <WithdrawalPopup
          product={withdrawalProduct.product}
          store={withdrawalProduct.store}
          item={withdrawalProduct.item}
          category={withdrawalProduct.category}
          onClose={() => setWithdrawalProduct(null)}
        />
      )}
    </div>
  );
};

export default OperationsManager;
