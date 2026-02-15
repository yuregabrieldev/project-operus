
import React, { useState } from 'react';
import PurchaseList from './PurchaseList';
import PurchaseOrders from './PurchaseOrders';
import { useLanguage } from '@/contexts/LanguageContext';
import { ShoppingCart, FileText } from 'lucide-react';

const PurchaseSuggestions: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'suggestions' | 'orders'>('suggestions');

  return (
    <div className="space-y-6 bg-background min-h-screen">
      <div className="bg-card border-b">
        <div className="px-6 pt-6 pb-4 space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('purchases.title')}</h1>
            <p className="text-sm text-muted-foreground mt-1">Gestão de sugestões e pedidos de compra</p>
          </div>

          {/* Tab Navigation */}
          <div>
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg w-fit">
              <button
                onClick={() => setActiveTab('suggestions')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'suggestions'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <ShoppingCart className="h-4 w-4" />
                {t('purchases.tabSuggestions')}
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'orders'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <FileText className="h-4 w-4" />
                {t('orders.title')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'suggestions' ? <PurchaseList /> : <PurchaseOrders />}
    </div>
  );
};

export default PurchaseSuggestions;
