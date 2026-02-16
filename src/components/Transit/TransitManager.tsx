
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/ui/stats-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Truck, Package, MapPin, Clock, Plus, Eye, CheckCircle, Search, Download, FileDown, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
    categories,
    suppliers,
    inventory,
    getProductById,
    getStoreById,
    updateMovement
  } = useData();

  const [selectedMovement, setSelectedMovement] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [originStore, setOriginStore] = useState<string>('all');
  const [destStore, setDestStore] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Export CSV state
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState<Date>(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d;
  });
  const [exportEndDate, setExportEndDate] = useState<Date>(() => new Date());
  const [exportStore, setExportStore] = useState<string>('all');

  // Filter Logic
  const filteredMovements = useMemo(() => {
    return movements
      .filter(m => m.type === 'transfer')
      .filter(movement => {
        const product = getProductById(movement.productId);
        if (!product) return false;

        if (statusFilter !== 'all' && movement.status !== statusFilter) return false;
        if (selectedCategory !== 'all' && product.categoryId !== selectedCategory) return false;
        if (selectedSupplier !== 'all' && product.supplierId !== selectedSupplier) return false;
        if (originStore !== 'all' && movement.fromStoreId !== originStore) return false;
        if (destStore !== 'all' && movement.toStoreId !== destStore) return false;

        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          return (
            product.name.toLowerCase().includes(term) ||
            product.sku.toLowerCase().includes(term)
          );
        }

        return true;
      });
  }, [movements, statusFilter, selectedCategory, selectedSupplier, originStore, destStore, searchTerm, getProductById]);

  // Stats
  const stats = useMemo(() => {
    const transferMovements = movements.filter(m => m.type === 'transfer');
    return {
      total: transferMovements.length,
      pending: transferMovements.filter(m => m.status === 'pending').length,
      in_transit: transferMovements.filter(m => m.status === 'in_transit').length,
      delivered: transferMovements.filter(m => m.status === 'delivered').length
    };
  }, [movements]);

  // Export data computation
  const exportData = useMemo(() => {
    const start = new Date(exportStartDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(exportEndDate);
    end.setHours(23, 59, 59, 999);

    const transfersInRange = movements
      .filter(m => m.type === 'transfer')
      .filter(m => {
        const date = new Date(m.createdAt);
        return date >= start && date <= end;
      })
      .filter(m => {
        if (exportStore === 'all') return true;
        return m.fromStoreId === exportStore || m.toStoreId === exportStore;
      });

    // Aggregate by product
    const productMap = new Map<string, { name: string; moved: number; balance: number }>();

    transfersInRange.forEach(m => {
      const product = getProductById(m.productId);
      if (!product) return;

      const existing = productMap.get(m.productId);
      // moved = net outgoing quantity (negative means product left the selected store)
      let moveDelta = 0;
      if (exportStore === 'all') {
        // If all stores, show total movement volume as negative (outgoing)
        moveDelta = -(m.quantity || 0);
      } else if (m.fromStoreId === exportStore) {
        moveDelta = -(m.quantity || 0); // outgoing
      } else if (m.toStoreId === exportStore) {
        moveDelta = (m.quantity || 0); // incoming
      }

      if (existing) {
        existing.moved += moveDelta;
      } else {
        productMap.set(m.productId, {
          name: product.name,
          moved: moveDelta,
          balance: 0
        });
      }
    });

    // Calculate current balance for each product in the selected store
    productMap.forEach((data, productId) => {
      if (exportStore === 'all') {
        // Sum across all stores
        const totalQty = inventory
          .filter((inv: any) => inv.productId === productId)
          .reduce((sum: number, inv: any) => sum + (inv.currentQuantity || 0), 0);
        data.balance = totalQty;
      } else {
        const inv = inventory.find((i: any) => i.productId === productId && i.storeId === exportStore);
        data.balance = inv ? inv.currentQuantity : 0;
      }
    });

    // Sort by moved (most negative first)
    return Array.from(productMap.values()).sort((a, b) => a.moved - b.moved);
  }, [movements, exportStartDate, exportEndDate, exportStore, getProductById, inventory]);

  const handleDownloadCSV = () => {
    if (exportData.length === 0) return;

    const storeName = exportStore === 'all'
      ? t('transit.export_all_stores')
      : stores.find((s: any) => s.id === exportStore)?.name || '';

    const startStr = format(exportStartDate, 'dd/MM/yyyy');
    const endStr = format(exportEndDate, 'dd/MM/yyyy');
    const periodStr = `${startStr}-${endStr}`;

    const headers = [t('transit.export_product'), t('transit.export_period'), t('transit.export_quantity_csv')];
    const rows = exportData.map(row => [
      `"${row.name}"`,
      `"${periodStr}"`,
      row.moved
    ]);

    const csvContent = [
      headers.join(';'), // Using semicolon for broader Excel compatibility in some regions, or comma. User image shows Excel, usually semicolon in PT/BR/EU but comma in US. Standard CSV is comma. Sticking to comma for now unless issues arise, but adding BOM handles most. 
      ...rows.map(r => r.join(';'))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `movimentacoes_${storeName}_${format(exportStartDate, 'yyyy-MM-dd')}_${format(exportEndDate, 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: t('transit.export_csv'),
      description: `${exportData.length} ${t('common.product').toLowerCase()}(s)`,
    });
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" => {
    switch (status) {
      case 'delivered': return 'success';
      case 'in_transit': return 'info';
      case 'pending': return 'warning';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="h-3.5 w-3.5" />;
      case 'in_transit': return <Truck className="h-3.5 w-3.5" />;
      case 'pending': return <Clock className="h-3.5 w-3.5" />;
      default: return <Package className="h-3.5 w-3.5" />;
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {t('transit.title')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('transit.description')}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsExportOpen(true)}
            className="border-border hover:bg-muted"
          >
            <Download className="h-4 w-4 mr-2" />
            {t('transit.export_csv')}
          </Button>
          <Button onClick={handleAddNew} className="bg-primary hover:bg-primary/90 shadow-md">
            <Plus className="h-4 w-4 mr-2" />
            {t('transit.create_transfer')}
          </Button>
        </div>
      </div>

      {/* Filters — ABOVE Stats Cards */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
            <Search className="h-4 w-4" />
            {t('transit.filters_title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Row 1 */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder={t('transit.filter_category')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('inventory.allCategories')}</SelectItem>
                {categories.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
              <SelectTrigger>
                <SelectValue placeholder={t('transit.filter_supplier')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('inventory.allSuppliers')}</SelectItem>
                {suppliers.map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Row 2 - Product Search */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={t('transit.filter_product')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Row 3 - Stores */}
            <Select value={originStore} onValueChange={setOriginStore}>
              <SelectTrigger>
                <SelectValue placeholder={t('transit.filter_origin')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('inventory.allStores')}</SelectItem>
                {stores.map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={destStore} onValueChange={setDestStore}>
              <SelectTrigger>
                <SelectValue placeholder={t('transit.filter_destination')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('inventory.allStores')}</SelectItem>
                {stores.map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Row 4 - Status */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="md:col-span-2">
                <SelectValue placeholder={t('transit.filter_status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('transit.all_status')}</SelectItem>
                <SelectItem value="pending">{t('transit.pending')}</SelectItem>
                <SelectItem value="in_transit">{t('transit.in_transit')}</SelectItem>
                <SelectItem value="delivered">{t('transit.delivered')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title={t('transit.total')}
          value={stats.total}
          icon={Package}
          variant="purple"
        />

        <StatsCard
          title={t('transit.pending')}
          value={stats.pending}
          icon={Clock}
          variant="warning"
        />

        <StatsCard
          title={t('transit.in_transit')}
          value={stats.in_transit}
          icon={Truck}
          variant="default"
        />

        <StatsCard
          title={t('transit.delivered')}
          value={stats.delivered}
          icon={CheckCircle}
          variant="success"
        />
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
                  <TableHead className="w-[80px] text-center">{t('transit.product_photo')}</TableHead>
                  <TableHead>{t('common.product')}</TableHead>
                  <TableHead>{t('transit.from')}</TableHead>
                  <TableHead>{t('transit.to')}</TableHead>
                  <TableHead>{t('common.quantity')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                  <TableHead>{t('transit.created_at')}</TableHead>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.map((movement) => {
                  const product = getProductById(movement.productId);
                  const fromStore = movement.fromStoreId ? getStoreById(movement.fromStoreId) : null;
                  const toStore = movement.toStoreId ? getStoreById(movement.toStoreId) : null;
                  const isPending = movement.status === 'pending';

                  return (
                    <TableRow key={movement.id} className="hover:bg-muted/50">
                      {/* Photo Column */}
                      <TableCell className="text-center p-2">
                        <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center overflow-hidden mx-auto">
                          {product?.imageUrl ? (
                            <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Package className="h-5 w-5 text-muted-foreground/50" />
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="text-sm text-foreground">{product?.name}</span>
                          <span className="text-xs text-muted-foreground">SKU: {product?.sku}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground/70" />
                          {fromStore?.name || t('transit.external')}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground/70" />
                          {toStore?.name || t('transit.external')}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="font-semibold bg-muted/50">
                          {movement.quantity}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <Badge variant={getStatusVariant(movement.status)} className="transition-all duration-300">
                          <div className="flex items-center gap-1.5">
                            {/* Heartbeat Effect for Pending */}
                            {isPending && (
                              <span className="relative flex h-2 w-2 mr-0.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                              </span>
                            )}
                            {!isPending && getStatusIcon(movement.status)}
                            {t(`transit.${movement.status}`)}
                          </div>
                        </Badge>
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(movement.createdAt)}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleEdit(movement)}>
                            <Eye className="h-4 w-4" />
                          </Button>

                          {getNextStatus(movement.status) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateMovementStatus(movement.id, getNextStatus(movement.status)!)}
                              className="h-8 w-8 p-0 text-primary hover:bg-primary/10 border-primary/20 hover:border-primary/30"
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
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-1">{t('transit.no_movements')}</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                {t('inventory.noProductsFilters')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transit Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
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

      {/* Export CSV Dialog */}
      <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <FileDown className="h-5 w-5 text-blue-600" />
              {t('transit.export_title')}
            </DialogTitle>
          </DialogHeader>

          {/* Date & Store Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('transit.export_start_date')}:</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal h-10"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                    {format(exportStartDate, 'dd/MM/yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={exportStartDate}
                    onSelect={(day) => day && setExportStartDate(day)}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('transit.export_end_date')}:</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal h-10"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                    {format(exportEndDate, 'dd/MM/yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={exportEndDate}
                    onSelect={(day) => day && setExportEndDate(day)}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('transit.export_store')}:</Label>
              <Select value={exportStore} onValueChange={setExportStore}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder={t('transit.export_store')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('transit.export_all_stores')}</SelectItem>
                  {stores.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Section Title */}
          <h3 className="text-center font-semibold text-gray-700 text-sm mt-4 mb-2">
            {t('transit.export_moved_qty')}
          </h3>

          {/* Movement Summary Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted hover:bg-muted">
                  <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">
                    {t('transit.export_product')}
                  </TableHead>
                  <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider text-center">
                    {t('transit.export_moved')}
                  </TableHead>
                  <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider text-right">
                    {t('transit.export_balance')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exportData.length > 0 ? (
                  exportData.map((row, idx) => (
                    <TableRow key={idx} className={idx % 2 === 0 ? 'bg-background hover:bg-muted/50' : 'bg-muted/30 hover:bg-muted/50'}>
                      <TableCell className="text-sm font-medium text-foreground">
                        {row.name}
                      </TableCell>
                      <TableCell className={`text-sm font-semibold text-center ${row.moved < 0 ? 'text-destructive' : row.moved > 0 ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                        {row.moved}
                      </TableCell>
                      <TableCell className="text-sm font-bold text-right text-foreground">
                        {row.balance}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-10 text-gray-400 text-sm">
                      <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      {t('transit.export_no_data')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Download Button */}
          <div className="flex justify-end pt-3">
            <Button
              onClick={handleDownloadCSV}
              disabled={exportData.length === 0}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm disabled:opacity-40"
            >
              <Download className="h-4 w-4 mr-2" />
              {t('transit.export_download')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TransitManager;
