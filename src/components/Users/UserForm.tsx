import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useUsers } from '@/contexts/UsersContext';
import { useBrand } from '@/contexts/BrandContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff, RefreshCw, Building2, Store } from 'lucide-react';

interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const generatePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const emptyForm = {
  name: '',
  email: '',
  role: 'assistant' as 'admin' | 'manager' | 'assistant',
  selectedStores: [] as string[],
  password: '',
  sendWelcomeEmail: true,
};

export const UserForm: React.FC<UserFormProps> = ({ isOpen, onClose }) => {
  const { addUser } = useUsers();
  const { stores, selectedBrand } = useBrand();
  const { t } = useLanguage();
  const [formData, setFormData] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allStores = stores.filter(s => s.brandId === selectedBrand?.id);

  const handleGeneratePassword = useCallback(() => {
    setFormData(prev => ({ ...prev, password: generatePassword() }));
    setShowPassword(true);
  }, []);

  const handleStoreToggle = (storeId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedStores: prev.selectedStores.includes(storeId)
        ? prev.selectedStores.filter(id => id !== storeId)
        : [...prev.selectedStores, storeId],
    }));
  };

  const handleClose = () => {
    setFormData(emptyForm);
    setShowPassword(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (!formData.name.trim()) throw new Error(t('users.nameRequired'));
      if (!formData.email.trim()) throw new Error(t('users.emailRequired'));
      if (!formData.email.includes('@')) throw new Error(t('users.emailInvalid'));
      if (!formData.password || formData.password.length < 6) throw new Error(t('users.passwordTooShort'));

      // When there's only 1 store the selector is hidden — use it automatically.
      // When there are multiple stores, require the admin to pick at least one.
      const effectiveStoreIds =
        allStores.length === 1
          ? [allStores[0].id]
          : formData.selectedStores;

      if (allStores.length > 1 && effectiveStoreIds.length === 0) {
        throw new Error(t('users.selectAtLeastOneStore'));
      }

      const selectedStoreObjects = allStores
        .filter(store => effectiveStoreIds.includes(store.id))
        .map(store => ({ id: parseInt(store.id) || 0, name: store.name, address: store.address, isActive: store.isActive }));

      await addUser({
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        stores: selectedStoreObjects,
        storeIds: effectiveStoreIds,
        password: formData.password,
        sendWelcomeEmail: formData.sendWelcomeEmail,
      });

      toast({
        title: t('users.userCreated'),
        description: t('users.tempPassword', { password: formData.password }),
        duration: 15000,
      });

      handleClose();
    } catch (error) {
      toast({
        title: t('users.createError'),
        description: error instanceof Error ? error.message : t('users.unknownError'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('users.newUser')}</DialogTitle>
        </DialogHeader>

        {/* Brand + Store context info */}
        {selectedBrand && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/60 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Building2 className="w-3.5 h-3.5" />
              <span className="font-medium text-foreground">{selectedBrand.name}</span>
            </div>
            {allStores.length === 1 && (
              <>
                <span className="text-muted-foreground">·</span>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Store className="w-3.5 h-3.5" />
                  <span>{allStores[0].name}</span>
                </div>
              </>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">{t('users.fullName')}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={t('users.fullNamePlaceholder')}
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">{t('users.email')}</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder={t('users.emailPlaceholder')}
              required
            />
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">{t('users.userRole')}</Label>
            <Select value={formData.role} onValueChange={(value: any) => setFormData(prev => ({ ...prev, role: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="assistant">{t('users.roleAssistant')}</SelectItem>
                <SelectItem value="manager">{t('users.roleManager')}</SelectItem>
                <SelectItem value="admin">{t('users.roleAdmin')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Temporary password */}
          <div className="space-y-2">
            <Label htmlFor="password">{t('users.tempPasswordLabel')}</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder={t('users.tempPasswordPlaceholder')}
                  className="pr-9"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Button type="button" variant="outline" size="icon" onClick={handleGeneratePassword} title={t('users.generatePassword')}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{t('users.tempPasswordHint')}</p>
          </div>

          {/* Stores */}
          {allStores.length > 1 && (
            <div className="space-y-2">
              <Label>{t('users.linkedStores')}</Label>
              <div className="border rounded-lg divide-y">
                {allStores.map((store) => (
                  <label
                    key={store.id}
                    className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/40 transition-colors"
                  >
                    <Checkbox
                      id={`store-${store.id}`}
                      checked={formData.selectedStores.includes(store.id)}
                      onCheckedChange={() => handleStoreToggle(store.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{store.name}</p>
                      {store.address && (
                        <p className="text-xs text-muted-foreground truncate">{store.address}</p>
                      )}
                    </div>
                    {formData.selectedStores.includes(store.id) && (
                      <Badge variant="secondary" className="text-xs shrink-0">{t('users.selected')}</Badge>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Welcome email */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="welcome-email"
              checked={formData.sendWelcomeEmail}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, sendWelcomeEmail: !!checked }))}
            />
            <Label htmlFor="welcome-email" className="text-sm cursor-pointer">
              {t('users.sendWelcomeEmail')}
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              {t('users.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('users.creating') : t('users.createUser')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
