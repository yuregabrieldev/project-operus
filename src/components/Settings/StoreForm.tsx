
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useData } from '@/contexts/DataContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';

interface StoreFormProps {
  store?: any;
  onClose: () => void;
}

export const StoreForm: React.FC<StoreFormProps> = ({ store, onClose }) => {
  const { t } = useLanguage();
  const { addStore, updateStore } = useData();
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contact: '',
    isActive: true
  });

  useEffect(() => {
    if (store) {
      setFormData({
        name: store.name,
        address: store.address,
        contact: store.contact,
        isActive: store.isActive
      });
    }
  }, [store]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (store) {
      updateStore(store.id, formData);
      toast({
        title: t('settings.store_updated'),
        description: t('settings.store_updated_successfully'),
      });
    } else {
      addStore(formData);
      toast({
        title: t('settings.store_added'),
        description: t('settings.store_added_successfully'),
      });
    }
    
    onClose();
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('common.name')}
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('settings.address')}
        </label>
        <textarea
          value={formData.address}
          onChange={(e) => handleChange('address', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('settings.contact')}
        </label>
        <input
          type="text"
          value={formData.contact}
          onChange={(e) => handleChange('contact', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => handleChange('isActive', e.target.checked)}
          className="mr-2"
        />
        <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
          {t('settings.store_active')}
        </label>
      </div>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          {store ? t('common.update') : t('common.add')}
        </Button>
      </div>
    </form>
  );
};
