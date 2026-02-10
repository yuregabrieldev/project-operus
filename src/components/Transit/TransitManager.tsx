
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Truck, Package, MapPin, Clock, Plus, Eye, CheckCircle } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';
import { TransitForm } from './TransitForm';

const TransitManager: React.FC = () => {
  const { t } = useLanguage();
  const { 
    movements, 
    products,
    stores,
    getProductById, 
    getStoreById,
    updateMovement,
    addMovement
  } = useData();
  
  const [selectedMovement, setSelectedMovement] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const getFilteredMovements = () => {
    const transferMovements = movements.filter(m => m.type === 'transfer');
    if (statusFilter === 'all') return transferMovements;
    return transferMovements.filter(movement => movement.status === statusFilter);
  };

  const filteredMovements = getFilteredMovements();

  const getStatusStats = () => {
    const transferMovements = movements.filter(m => m.type === 'transfer');
    return {
      total: transferMovements.length,
      pending: transferMovements.filter(m => m.status === 'pending').length,
      in_transit: transferMovements.filter(m => m.status === 'in_transit').length,
      delivered: transferMovements.filter(m => m.status === 'delivered').length
    };
  };

  const stats = getStatusStats();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_transit': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'in_transit': return <Truck className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const updateMovementStatus = (movementId: string, newStatus: 'pending' | 'in_transit' | 'delivered') => {
    updateMovement(movementId, { status: newStatus });
    
    toast({
      title: t('transit.status_updated'),
      description: `${t('transit.movement')} ${t('transit.updated_to')} ${t(`transit.${newStatus}`)}`,
    });
  };

  const handleEdit = (movement: any) => {
    setSelectedMovement(movement);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedMovement(null);
    setIsFormOpen(true);
  };

  const getNextStatus = (currentStatus: string): 'pending' | 'in_transit' | 'delivered' | null => {
    switch (currentStatus) {
      case 'pending': return 'in_transit';
      case 'in_transit': return 'delivered';
      default: return null;
    }
  };

  const getNextStatusLabel = (currentStatus: string) => {
    const nextStatus = getNextStatus(currentStatus);
    return nextStatus ? t(`transit.mark_as_${nextStatus}`) : null;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('transit.title')}
          </h1>
          <p className="text-gray-600 mt-2">
            {t('transit.description')}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">{t('transit.all_status')}</option>
            <option value="pending">{t('transit.pending')}</option>
            <option value="in_transit">{t('transit.in_transit')}</option>
            <option value="delivered">{t('transit.delivered')}</option>
          </select>
          
          <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            {t('transit.new_transfer')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('transit.total')}</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('transit.pending')}</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('transit.in_transit')}</p>
                <p className="text-2xl font-bold text-blue-600">{stats.in_transit}</p>
              </div>
              <Truck className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('transit.delivered')}</p>
                <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Movements Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            {t('transit.movements')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('common.product')}</TableHead>
                  <TableHead>{t('transit.from')}</TableHead>
                  <TableHead>{t('transit.to')}</TableHead>
                  <TableHead>{t('common.quantity')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                  <TableHead>{t('transit.created_at')}</TableHead>
                  <TableHead>{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.map((movement) => {
                  const product = getProductById(movement.productId);
                  const fromStore = movement.fromStoreId ? getStoreById(movement.fromStoreId) : null;
                  const toStore = movement.toStoreId ? getStoreById(movement.toStoreId) : null;
                  
                  return (
                    <TableRow key={movement.id}>
                      <TableCell className="font-medium">
                        {product?.name}
                        <div className="text-sm text-gray-500">
                          SKU: {product?.sku}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          {fromStore?.name || t('transit.external')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          {toStore?.name || t('transit.external')}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {movement.quantity}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(movement.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(movement.status)}
                            {t(`transit.${movement.status}`)}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDate(movement.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(movement)}>
                            <Eye className="h-3 w-3" />
                          </Button>
                          
                          {getNextStatus(movement.status) && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateMovementStatus(movement.id, getNextStatus(movement.status)!)}
                              className="text-blue-600 hover:bg-blue-50"
                              title={getNextStatusLabel(movement.status) || ''}
                            >
                              {getStatusIcon(getNextStatus(movement.status)!)}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          
          {filteredMovements.length === 0 && (
            <div className="text-center py-8">
              <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">{t('transit.no_movements')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transit Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedMovement ? t('transit.view_transfer') : t('transit.new_transfer')}
            </DialogTitle>
          </DialogHeader>
          <TransitForm 
            movement={selectedMovement}
            onClose={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TransitManager;
