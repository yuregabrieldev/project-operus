import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUsers } from '@/contexts/UsersContext';
import { useBrand } from '@/contexts/BrandContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';

interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserForm: React.FC<UserFormProps> = ({ isOpen, onClose }) => {
  const { addUser } = useUsers();
  const { stores } = useBrand();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'assistant' as 'admin' | 'manager' | 'assistant',
    selectedStores: [] as string[],
    sendWelcomeEmail: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allStores = stores || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validações
      if (!formData.name.trim()) {
        throw new Error(t('users.nameRequired'));
      }
      if (!formData.email.trim()) {
        throw new Error(t('users.emailRequired'));
      }
      if (!formData.email.includes('@')) {
        throw new Error(t('users.emailInvalid'));
      }
      if (formData.selectedStores.length === 0) {
        throw new Error(t('users.selectAtLeastOneStore'));
      }

      // Convert selected store IDs to store objects
      const selectedStoreObjects = allStores
        .filter(store => formData.selectedStores.includes(store.id))
        .map(store => ({
          id: parseInt(store.id),
          name: store.name,
          address: store.address,
          isActive: store.isActive
        }));

      const userData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        stores: selectedStoreObjects,
        sendWelcomeEmail: formData.sendWelcomeEmail
      };

      const tempPassword = addUser(userData);

      toast({
        title: t('users.userCreated'),
        description: t('users.tempPassword', { password: tempPassword }),
        duration: 10000,
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        role: 'assistant',
        selectedStores: [],
        sendWelcomeEmail: true
      });

      onClose();
    } catch (error) {
      toast({
        title: t('users.createError'),
        description: error instanceof Error ? error.message : t('users.unknownError'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStoreToggle = (storeId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedStores: prev.selectedStores.includes(storeId)
        ? prev.selectedStores.filter(id => id !== storeId)
        : [...prev.selectedStores, storeId]
    }));
  };

  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      role: 'assistant',
      selectedStores: [],
      sendWelcomeEmail: true
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('users.newUser')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="space-y-2">
            <Label htmlFor="role">{t('users.userRole')}</Label>
            <Select value={formData.role} onValueChange={(value: any) => setFormData(prev => ({ ...prev, role: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">{t('users.roleEmployee')}</SelectItem>
                <SelectItem value="manager">{t('users.roleManager')}</SelectItem>
                <SelectItem value="admin">{t('users.roleAdmin')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('users.linkedStores')}</Label>
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {allStores.map((store) => (
                    <div key={store.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`store-${store.id}`}
                        checked={formData.selectedStores.includes(store.id)}
                        onCheckedChange={() => handleStoreToggle(store.id)}
                      />
                      <Label htmlFor={`store-${store.id}`} className="text-sm">
                        {store.name}
                      </Label>
                    </div>
                  ))}
                </div>
                {allStores.length === 0 && (
                  <p className="text-sm text-muted-foreground">{t('users.noStoresAvailable')}</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="welcome-email"
              checked={formData.sendWelcomeEmail}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, sendWelcomeEmail: !!checked }))}
            />
            <Label htmlFor="welcome-email" className="text-sm">
              {t('users.sendWelcomeEmail')}
            </Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
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
