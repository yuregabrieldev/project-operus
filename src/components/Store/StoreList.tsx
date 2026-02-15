
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, ToggleLeft, ToggleRight, Search } from 'lucide-react';
import { useBrand } from '@/contexts/BrandContext';
import { toast } from '@/hooks/use-toast';

interface StoreListProps {
  onEditStore: (store: any) => void;
}

export const StoreList: React.FC<StoreListProps> = ({ onEditStore }) => {
  const { stores, userBrands, toggleStoreStatus } = useBrand();
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
    return brand?.name || 'Marca não encontrada';
  };

  const handleToggleStatus = async (store: any) => {
    try {
      if (store.isActive) {
        // Simular verificação de estoque
        const hasStock = Math.random() > 0.7; // 30% chance de ter estoque
        if (hasStock) {
          toast({
            title: "Não é possível desativar a loja",
            description: "Transfira os produtos primeiro antes de desativar esta loja.",
            variant: "destructive"
          });
          return;
        }
      }

      await toggleStoreStatus(store.id);

      toast({
        title: store.isActive ? "Loja desativada" : "Loja ativada",
        description: `A loja ${store.name} foi ${store.isActive ? 'desativada' : 'ativada'} com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao alterar status",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de Lojas</CardTitle>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por nome ou endereço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={brandFilter} onValueChange={setBrandFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrar por marca" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as marcas</SelectItem>
              {userBrands.map(brand => (
                <SelectItem key={brand.id} value={brand.id}>
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="active">Ativas</SelectItem>
              <SelectItem value="inactive">Inativas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {filteredStores.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {searchTerm || brandFilter !== 'all' || statusFilter !== 'all'
                ? 'Nenhuma loja encontrada com os filtros aplicados.'
                : 'Nenhuma loja cadastrada ainda.'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Gerente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
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
                        {store.isActive ? "Ativa" : "Inativa"}
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
