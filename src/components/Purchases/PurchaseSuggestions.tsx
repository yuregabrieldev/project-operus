
import React, { useState } from 'react';
import PurchaseList from './PurchaseList';
import PurchaseOrders from './PurchaseOrders';
import { useLanguage } from '@/contexts/LanguageContext';
import { ShoppingCart, FileText } from 'lucide-react';

const PurchaseSuggestions: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'suggestions' | 'orders'>('suggestions');

  return (
    <div>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 bg-white px-6">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`flex items-center gap-2 py-4 px-1 border-b-2 text-sm font-medium transition-colors ${activeTab === 'suggestions'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <ShoppingCart className="h-4 w-4" />
            {t('purchases.title')}
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 py-4 px-1 border-b-2 text-sm font-medium transition-colors ${activeTab === 'orders'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <FileText className="h-4 w-4" />
            {t('orders.title')}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'suggestions' ? <PurchaseList /> : <PurchaseOrders />}
    </div>
  );
};

export default PurchaseSuggestions;
