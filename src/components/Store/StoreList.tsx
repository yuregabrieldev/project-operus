
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, ToggleLeft, ToggleRight, Search } from 'lucide-react';
import { useBrand } from '@/contexts/BrandContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';

interface StoreListProps {
  onEditStore: (store: any) => void;
}

export const StoreList: React.FC<StoreListProps> = ({ onEditStore }) => {
  const { stores, userBrands, toggleStoreStatus } = useBrand();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredStores = useMemo(() => {
    return stores.filter(store => {
      const matchesSearch = store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.address.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBrand = brandFilter === 'all' || store.brandId === brandFilter;
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && store.isActive) ||
        (statusFilter === 'inactive' && !store.isActive);

      return matchesSearch && matchesBrand && matchesStatus;
    });
  }, [stores, searchTerm, brandFilter, statusFilter]);

  const getBrandName = (brandId: string) => {
    const brand = userBrands.find(b => b.id === brandId);
    return brand?.name || t('stores.brandNotFound');
  };

  const handleToggleStatus = async (store: any) => {
    try {
      if (store.isActive) {
        // Simular verificação de estoque
        const hasStock = Math.random() > 0.7; // 30% chance de ter estoque
        if (hasStock) {
          toast({
            title: t('stores.cannotDeactivate'),
            description: t('stores.transferFirst'),
            variant: "destructive"
          });
          return;
        }
      }

      await toggleStoreStatus(store.id);

      toast({
        title: store.isActive ? t('stores.storeDeactivated') : t('stores.storeActivated'),
        description: t('stores.storeStatusChanged', { name: store.name, status: store.isActive ? t('stores.deactivated') : t('stores.activated') }),
      });
    } catch (error) {
      toast({
        title: t('stores.statusChangeError'),
        description: t('stores.tryAgainLater'),
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('stores.storeList')}</CardTitle>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={t('stores.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={brandFilter} onValueChange={setBrandFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder={t('stores.filterByBrand')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('stores.allBrands')}</SelectItem>
              {userBrands.map(brand => (
                <SelectItem key={brand.id} value={brand.id}>
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder={t('stores.filterByStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('stores.allStatuses')}</SelectItem>
              <SelectItem value="active">{t('stores.activeFilter')}</SelectItem>
              <SelectItem value="inactive">{t('stores.inactiveFilter')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {filteredStores.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {searchTerm || brandFilter !== 'all' || statusFilter !== 'all'
                ? t('stores.noStoresFiltered')
                : t('stores.noStoresYet')
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead>{t('stores.name')}</TableHead>
                  <TableHead>{t('stores.address')}</TableHead>
                  <TableHead>{t('stores.brand')}</TableHead>
                  <TableHead>{t('stores.manager')}</TableHead>
                  <TableHead>{t('stores.status')}</TableHead>
                  <TableHead className="text-right">{t('stores.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStores.map((store) => (
                  <TableRow key={store.id}>
                    <TableCell className="font-medium">{store.name}</TableCell>
                    <TableCell className="text-muted-foreground">{store.address}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getBrandName(store.brandId)}
                      </Badge>
                    </TableCell>
                    <TableCell>{store.manager}</TableCell>
                    <TableCell>
                      <Badge variant={store.isActive ? "default" : "secondary"}>
                        {store.isActive ? t('stores.active') : t('stores.inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditStore(store)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(store)}
                        >
                          {store.isActive ? (
                            <ToggleRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
