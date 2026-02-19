
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useBrand } from '@/contexts/BrandContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';
import { ImagePlus } from 'lucide-react';

interface StoreEditFormProps {
  store: any;
  isOpen: boolean;
  onClose: () => void;
}

export const StoreEditForm: React.FC<StoreEditFormProps> = ({ store, isOpen, onClose }) => {
  const { userBrands, updateStore } = useBrand();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contact: '',
    manager: '',
    brandId: '',
    image: null as File | null,
    imagePreview: '' as string,
    isActive: true
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (store) {
      setFormData({
        name: store.name || '',
        address: store.address || '',
        contact: store.contact || '',
        manager: store.manager || '',
        brandId: store.brandId || '',
        image: null,
        imagePreview: store.imageUrl || '',
        isActive: store.isActive !== undefined ? store.isActive : true
      });
    }
  }, [store]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);

    try {
      const updatedStore = {
        ...store,
        name: formData.name,
        address: formData.address,
        contact: formData.contact,
        manager: formData.manager,
        brandId: formData.brandId,
        isActive: formData.isActive,
        updatedAt: new Date().toISOString()
      };

      await updateStore(updatedStore);

      toast({
        title: t('stores.storeUpdated'),
        description: t('stores.storeUpdatedDesc', { name: formData.name }),
      });

      onClose();
    } catch (error) {
      console.error('Erro ao atualizar loja:', error);
      toast({
        title: t('stores.updateError'),
        description: t('stores.tryAgainLater'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const selectedBrand = userBrands.find(brand => brand.id === formData.brandId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('stores.editStore')} - {store?.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('stores.storeName')}</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder={t('stores.storeNamePlaceholder')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">{t('stores.addressLabel')}</Label>
            <Input
              id="address"
              type="text"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder={t('stores.addressPlaceholder')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact">{t('stores.contactPhone')}</Label>
            <Input
              id="contact"
              type="tel"
              value={formData.contact}
              onChange={(e) => handleChange('contact', e.target.value)}
              placeholder="(11) 99999-9999"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="manager">{t('stores.managerLabel')}</Label>
            <Input
              id="manager"
              type="text"
              value={formData.manager}
              onChange={(e) => handleChange('manager', e.target.value)}
              placeholder={t('stores.managerPlaceholder')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand">{t('stores.brand')}</Label>
            <Select value={formData.brandId} onValueChange={(value) => handleChange('brandId', value)}>
              <SelectTrigger>
                <SelectValue placeholder={t('stores.selectBrand')} />
              </SelectTrigger>
              <SelectContent>
                {userBrands.map(brand => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('stores.storeImage')}</Label>
            {formData.imagePreview ? (
              <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                <img src={formData.imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setFormData(p => ({ ...p, image: null, imagePreview: '' }))} className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-black/70">&times;</button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors">
                <ImagePlus className="h-6 w-6 text-gray-400 mb-1" />
                <span className="text-xs text-gray-500">{t('stores.clickToAddImage')}</span>
                <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setFormData(p => ({ ...p, image: f, imagePreview: URL.createObjectURL(f) })); } }} />
              </label>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => handleChange('isActive', e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="isActive">{t('stores.storeActive')}</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('stores.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? t('stores.saving') : t('stores.saveChanges')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
