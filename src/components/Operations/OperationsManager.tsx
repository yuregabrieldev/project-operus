import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Package, Store } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useLanguage } from '@/contexts/LanguageContext';
import WithdrawalPopup from './WithdrawalPopup';

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
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
          entry.product.name.toLowerCase().includes(term) ||
          entry.product.sku.toLowerCase().includes(term) ||
          (entry.category?.name || '').toLowerCase().includes(term)
        );
      });
  }, [inventory, products, selectedStoreId, searchTerm, getCategoryById]);

  const selectedStore = stores.find((s: any) => s.id === selectedStoreId);

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('sidebar.operations')}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t('operationsPage.subtitle')}</p>
      </div>

      {/* Store Selector — Big Pill Buttons */}
      <div className="flex gap-2 flex-wrap">
        {stores.filter((s: any) => s.isActive).map((store: any) => (
          <button
            key={store.id}
            onClick={() => setSelectedStoreId(store.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${selectedStoreId === store.id
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            <Store className="h-4 w-4" />
            {store.name}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder={t('operationsPage.searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-11 rounded-xl border-gray-200 text-sm"
        />
      </div>

      {/* Product Grid — one tap to withdraw */}
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
              className="group flex flex-col items-center bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-lg hover:border-blue-200 hover:scale-[1.02] transition-all duration-200 cursor-pointer active:scale-95 text-center"
            >
              {/* Product Image */}
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center mb-3 overflow-hidden border border-slate-200 group-hover:border-blue-200 transition-colors">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <Package className="h-7 w-7 text-slate-300" />
                )}
              </div>

              {/* Product Name */}
              <p className="text-xs font-semibold text-gray-900 leading-tight mb-1.5 uppercase line-clamp-2 min-h-[2rem]">
                {product.name}
              </p>

              {/* Category Badge */}
              {category && (
                <Badge className="text-[10px] bg-blue-100 text-blue-700 hover:bg-blue-100 px-2 py-0 mb-2">
                  {category.name}
                </Badge>
              )}

              {/* Stock Quantity */}
              <div className={`text-lg font-bold ${isCritical ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-emerald-600'
                }`}>
                {item.currentQuantity}
              </div>
              <span className="text-[10px] text-gray-400 uppercase">{product.unit || 'UN.'}</span>
            </button>
          );
        })}
      </div>

      {/* Empty State */}
      {storeProducts.length === 0 && (
        <div className="text-center py-16">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">{t('operationsPage.noProducts')}</p>
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
