
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FileText, AlertCircle, CheckCircle, Clock, Plus, Edit, Search, Filter, Download, X, Check, ChevronDown, Calendar, ArrowLeft } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';
import { InvoiceForm } from './InvoiceForm';

const InvoiceManager: React.FC = () => {
  const { t } = useLanguage();
  const {
    invoices,
    suppliers,
    getSupplierById,
    updateInvoice,
  } = useData();

  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Filtros avançados
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [supplierFilter, setSupplierFilter] = useState<string[]>([]);
  const [issueDatePreset, setIssueDatePreset] = useState('all');
  const [issueDateStart, setIssueDateStart] = useState('');
  const [issueDateEnd, setIssueDateEnd] = useState('');
  const [dueDatePreset, setDueDatePreset] = useState('all');
  const [dueDateStart, setDueDateStart] = useState('');
  const [dueDateEnd, setDueDateEnd] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Popover states
  const [statusPopoverOpen, setStatusPopoverOpen] = useState(false);
  const [supplierPopoverOpen, setSupplierPopoverOpen] = useState(false);

  // Helper functions
  const isOverdue = (invoice: any) => {
    return invoice.status === 'pending' && new Date() > new Date(invoice.dueDate);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100';
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100';
      case 'overdue': return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'overdue': return <AlertCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  // Date preset helper
  const getDateRange = (preset: string): { start: string; end: string } => {
    const today = new Date();
    const formatISO = (d: Date) => d.toISOString().split('T')[0];

    switch (preset) {
      case 'today':
        return { start: formatISO(today), end: formatISO(today) };
      case '7d':
        return { start: formatISO(new Date(today.getTime() - 7 * 86400000)), end: formatISO(today) };
      case '30d':
        return { start: formatISO(new Date(today.getTime() - 30 * 86400000)), end: formatISO(today) };
      case '90d':
        return { start: formatISO(new Date(today.getTime() - 90 * 86400000)), end: formatISO(today) };
      case 'year':
        return { start: formatISO(new Date(today.getFullYear(), 0, 1)), end: formatISO(today) };
      default:
        return { start: '', end: '' };
    }
  };

  const handleIssueDatePreset = (preset: string) => {
    setIssueDatePreset(preset);
    if (preset !== 'custom' && preset !== 'all') {
      const range = getDateRange(preset);
      setIssueDateStart(range.start);
      setIssueDateEnd(range.end);
    } else if (preset === 'all') {
      setIssueDateStart('');
      setIssueDateEnd('');
    }
  };

  const handleDueDatePreset = (preset: string) => {
    setDueDatePreset(preset);
    if (preset !== 'custom' && preset !== 'all') {
      const range = getDateRange(preset);
      setDueDateStart(range.start);
      setDueDateEnd(range.end);
    } else if (preset === 'all') {
      setDueDateStart('');
      setDueDateEnd('');
    }
  };

  // Toggles
  const toggleStatusFilter = (status: string) => {
    setStatusFilter(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const toggleSupplierFilter = (supplierId: string) => {
    setSupplierFilter(prev =>
      prev.includes(supplierId) ? prev.filter(s => s !== supplierId) : [...prev, supplierId]
    );
  };

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const supplier = getSupplierById(invoice.supplierId);
      const invoiceDate = new Date(invoice.issueDate);
      const dueDate = new Date(invoice.dueDate);

      const matchesSearch = !searchTerm ||
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier?.name.toLowerCase().includes(searchTerm.toLowerCase());

      const currentStatus = isOverdue(invoice) ? 'overdue' : invoice.status;
      const matchesStatus = statusFilter.length === 0 || statusFilter.includes(currentStatus);

      const matchesSupplier = supplierFilter.length === 0 || supplierFilter.includes(invoice.supplierId);

      const matchesIssueDate = (!issueDateStart || invoiceDate >= new Date(issueDateStart)) &&
        (!issueDateEnd || invoiceDate <= new Date(issueDateEnd + 'T23:59:59'));

      const matchesDueDate = (!dueDateStart || dueDate >= new Date(dueDateStart)) &&
        (!dueDateEnd || dueDate <= new Date(dueDateEnd + 'T23:59:59'));

      const matchesAmount = (!minAmount || invoice.amount >= parseFloat(minAmount)) &&
        (!maxAmount || invoice.amount <= parseFloat(maxAmount));

      return matchesSearch && matchesStatus && matchesSupplier &&
        matchesIssueDate && matchesDueDate && matchesAmount;
    });
  }, [invoices, searchTerm, statusFilter, supplierFilter,
    issueDateStart, issueDateEnd, dueDateStart, dueDateEnd, minAmount, maxAmount]);

  // Stats
  const dashboardStats = useMemo(() => {
    const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const paidInvoices = filteredInvoices.filter(i => i.status === 'paid');
    const pendingInvoices = filteredInvoices.filter(i => i.status === 'pending');
    const overdueFiltered = filteredInvoices.filter(i => isOverdue(i));

    return {
      totalInvoices: filteredInvoices.length,
      totalAmount,
      paidCount: paidInvoices.length,
      paidAmount: paidInvoices.reduce((sum, inv) => sum + inv.amount, 0),
      pendingCount: pendingInvoices.length,
      pendingAmount: pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0),
      overdueCount: overdueFiltered.length,
      overdueAmount: overdueFiltered.reduce((sum, inv) => sum + inv.amount, 0),
    };
  }, [filteredInvoices]);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter([]);
    setSupplierFilter([]);
    setIssueDatePreset('all');
    setIssueDateStart('');
    setIssueDateEnd('');
    setDueDatePreset('all');
    setDueDateStart('');
    setDueDateEnd('');
    setMinAmount('');
    setMaxAmount('');
  };

  const markAsPaid = (invoice: any) => {
    updateInvoice(invoice.id, { status: 'paid', paidDate: new Date() });
    toast({
      title: t('invoices.markedAsPaid'),
      description: `${t('invoices.title')} ${invoice.invoiceNumber}`,
    });
  };

  const handleEdit = (invoice: any) => {
    setSelectedInvoice(invoice);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedInvoice(null);
    setIsFormOpen(true);
  };

  // CSV Export
  const exportCSV = () => {
    const headers = [
      'Nº Fatura', 'Fornecedor', 'Valor', 'Moeda',
      'Data Emissão', 'Data Vencimento', 'Data Pagamento', 'Status'
    ];

    const rows = filteredInvoices.map(invoice => {
      const supplier = getSupplierById(invoice.supplierId);
      const currentStatus = isOverdue(invoice) ? 'Vencida' :
        invoice.status === 'paid' ? 'Paga' :
          invoice.status === 'pending' ? 'Pendente' : invoice.status;

      return [
        invoice.invoiceNumber,
        supplier?.name || '',
        invoice.amount.toFixed(2).replace('.', ','),
        'EUR',
        formatDate(invoice.issueDate),
        formatDate(invoice.dueDate),
        invoice.paidDate ? formatDate(invoice.paidDate) : '',
        currentStatus
      ];
    });

    // BOM for UTF-8 + semicolon separator for Excel compatibility
    const BOM = '\uFEFF';
    const csvContent = BOM + [
      headers.join(';'),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `faturas_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: t('invoices.exported'),
      description: t('invoices.exportedDescription').replace('{count}', String(filteredInvoices.length)),
    });
  };

  // statusLabel for multi-dropdown
  const statusLabel = statusFilter.length === 0
    ? t('invoices.allStatuses')
    : statusFilter.length === 1
      ? statusFilter[0] === 'paid' ? t('invoices.paid') : statusFilter[0] === 'pending' ? t('invoices.pending') : t('invoices.overdue')
      : `${statusFilter.length} ${t('invoices.statusesSelected')}`;

  const supplierLabel = supplierFilter.length === 0
    ? t('invoices.allSuppliers')
    : supplierFilter.length === 1
      ? suppliers.find(s => s.id === supplierFilter[0])?.name || ''
      : `${supplierFilter.length} ${t('invoices.suppliersSelected')}`;

  const datePresetOptions = [
    { value: 'all', label: t('invoices.allDates') },
    { value: 'today', label: t('invoices.today') },
    { value: '7d', label: t('invoices.last7days') },
    { value: '30d', label: t('invoices.last30days') },
    { value: '90d', label: t('invoices.last90days') },
    { value: 'year', label: t('invoices.thisYear') },
    { value: 'custom', label: t('invoices.customRange') },
  ];

  // Full-page form view
  if (isFormOpen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="p-6 space-y-6">
          {/* Back + Title */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setIsFormOpen(false)}
              className="shadow-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('invoices.backToList')}
            </Button>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {selectedInvoice ? t('invoices.editInvoice') : t('invoices.newInvoice')}
              </h1>
              {selectedInvoice && (
                <p className="text-sm text-gray-500">
                  {t('invoices.number')}: {selectedInvoice.invoiceNumber}
                </p>
              )}
            </div>
          </div>

          {/* Form Card */}
          <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm max-w-4xl">
            <CardContent className="p-8">
              <InvoiceForm
                invoice={selectedInvoice}
                onClose={() => setIsFormOpen(false)}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {t('invoices.title')}
            </h1>
            <p className="text-gray-600">{t('invoices.description')}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant={showFilters ? "default" : "outline"}
              className="shadow-md"
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? t('invoices.hideFilters') : t('invoices.showFilters')}
            </Button>
            <Button onClick={handleAddNew} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              {t('invoices.newInvoice')}
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder={t('invoices.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 text-lg border-gray-200 focus:border-blue-500 focus:ring-blue-200"
                />
              </div>
              <Button onClick={clearFilters} variant="outline" className="h-12 px-6">
                <X className="h-4 w-4 mr-2" />
                {t('invoices.clearFilters')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Filters */}
        {showFilters && (
          <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50">
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-blue-600" />
                {t('invoices.advancedFilters')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Status Multi-Dropdown */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">{t('common.status')}</Label>
                  <Popover open={statusPopoverOpen} onOpenChange={setStatusPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between text-left font-normal h-10">
                        <span className="truncate">{statusLabel}</span>
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-2" align="start">
                      <div className="space-y-1">
                        <Button variant="ghost" className="w-full justify-start text-sm h-8" onClick={() => setStatusFilter([])}>
                          <div className={`w-4 h-4 mr-2 rounded border flex items-center justify-center ${statusFilter.length === 0 ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                            {statusFilter.length === 0 && <Check className="h-3 w-3 text-white" />}
                          </div>
                          {t('invoices.allStatuses')}
                        </Button>
                        {[
                          { value: 'paid', label: t('invoices.paid'), color: 'text-green-600' },
                          { value: 'pending', label: t('invoices.pending'), color: 'text-yellow-600' },
                          { value: 'overdue', label: t('invoices.overdue'), color: 'text-red-600' },
                        ].map(status => (
                          <Button key={status.value} variant="ghost" className="w-full justify-start text-sm h-8" onClick={() => toggleStatusFilter(status.value)}>
                            <div className={`w-4 h-4 mr-2 rounded border flex items-center justify-center ${statusFilter.includes(status.value) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                              {statusFilter.includes(status.value) && <Check className="h-3 w-3 text-white" />}
                            </div>
                            <span className={status.color}>{status.label}</span>
                          </Button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Supplier Multi-Dropdown */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">{t('invoices.supplierFilter')}</Label>
                  <Popover open={supplierPopoverOpen} onOpenChange={setSupplierPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between text-left font-normal h-10">
                        <span className="truncate">{supplierLabel}</span>
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-2" align="start">
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        <Button variant="ghost" className="w-full justify-start text-sm h-8" onClick={() => setSupplierFilter([])}>
                          <div className={`w-4 h-4 mr-2 rounded border flex items-center justify-center ${supplierFilter.length === 0 ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                            {supplierFilter.length === 0 && <Check className="h-3 w-3 text-white" />}
                          </div>
                          {t('invoices.allSuppliers')}
                        </Button>
                        {suppliers.map(supplier => (
                          <Button key={supplier.id} variant="ghost" className="w-full justify-start text-sm h-8" onClick={() => toggleSupplierFilter(supplier.id)}>
                            <div className={`w-4 h-4 mr-2 rounded border flex items-center justify-center ${supplierFilter.includes(supplier.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                              {supplierFilter.includes(supplier.id) && <Check className="h-3 w-3 text-white" />}
                            </div>
                            {supplier.name}
                          </Button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Issue Date Dynamic Dropdown */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">{t('invoices.issueDate')}</Label>
                  <Select value={issueDatePreset} onValueChange={handleIssueDatePreset}>
                    <SelectTrigger className="h-10">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {datePresetOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {issueDatePreset === 'custom' && (
                    <div className="flex gap-2 mt-2">
                      <Input type="date" value={issueDateStart} onChange={(e) => setIssueDateStart(e.target.value)} className="text-sm" />
                      <Input type="date" value={issueDateEnd} onChange={(e) => setIssueDateEnd(e.target.value)} className="text-sm" />
                    </div>
                  )}
                </div>

                {/* Due Date Dynamic Dropdown */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">{t('invoices.dueDate')}</Label>
                  <Select value={dueDatePreset} onValueChange={handleDueDatePreset}>
                    <SelectTrigger className="h-10">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {datePresetOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {dueDatePreset === 'custom' && (
                    <div className="flex gap-2 mt-2">
                      <Input type="date" value={dueDateStart} onChange={(e) => setDueDateStart(e.target.value)} className="text-sm" />
                      <Input type="date" value={dueDateEnd} onChange={(e) => setDueDateEnd(e.target.value)} className="text-sm" />
                    </div>
                  )}
                </div>

                {/* Amount Range */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">{t('invoices.amountRange')}</Label>
                  <div className="flex gap-2">
                    <Input type="number" placeholder={t('invoices.min')} value={minAmount} onChange={(e) => setMinAmount(e.target.value)} className="text-sm" />
                    <Input type="number" placeholder={t('invoices.max')} value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} className="text-sm" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">{t('invoices.totalInvoices')}</p>
                  <p className="text-3xl font-bold">{dashboardStats.totalInvoices}</p>
                  <p className="text-blue-100 text-sm mt-1">€{dashboardStats.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <FileText className="h-10 w-10 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">{t('invoices.paidLabel')}</p>
                  <p className="text-3xl font-bold">{dashboardStats.paidCount}</p>
                  <p className="text-green-100 text-sm mt-1">€{dashboardStats.paidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <CheckCircle className="h-10 w-10 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-gradient-to-br from-yellow-500 to-orange-500 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">{t('invoices.pendingLabel')}</p>
                  <p className="text-3xl font-bold">{dashboardStats.pendingCount}</p>
                  <p className="text-yellow-100 text-sm mt-1">€{dashboardStats.pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <Clock className="h-10 w-10 text-yellow-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">{t('invoices.overdueLabel')}</p>
                  <p className="text-3xl font-bold">{dashboardStats.overdueCount}</p>
                  <p className="text-red-100 text-sm mt-1">€{dashboardStats.overdueAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <AlertCircle className="h-10 w-10 text-red-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoices Table */}
        <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-blue-600" />
                <span>{t('invoices.listTitle')}</span>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {filteredInvoices.length} de {invoices.length}
                </Badge>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm font-normal text-gray-600">
                  Total: €{dashboardStats.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <Button size="sm" variant="outline" className="shadow-sm" onClick={exportCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  {t('invoices.export')}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="font-semibold text-gray-700">{t('invoices.number')}</TableHead>
                    <TableHead className="font-semibold text-gray-700">{t('invoices.supplierFilter')}</TableHead>
                    <TableHead className="font-semibold text-gray-700">{t('invoices.amount')}</TableHead>
                    <TableHead className="font-semibold text-gray-700">{t('invoices.issueDate')}</TableHead>
                    <TableHead className="font-semibold text-gray-700">{t('invoices.dueDate')}</TableHead>
                    <TableHead className="font-semibold text-gray-700">{t('invoices.paymentDate')}</TableHead>
                    <TableHead className="font-semibold text-gray-700">{t('common.status')}</TableHead>
                    <TableHead className="font-semibold text-gray-700">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => {
                    const overdueStatus = isOverdue(invoice);
                    const displayStatus = overdueStatus ? 'overdue' : invoice.status;
                    return (
                      <TableRow key={invoice.id} className={`hover:bg-gray-50/50 transition-colors ${overdueStatus ? 'bg-red-50/30' : ''}`}>
                        <TableCell className="font-medium text-gray-900">{invoice.invoiceNumber}</TableCell>
                        <TableCell className="text-gray-700">{getSupplierById(invoice.supplierId)?.name}</TableCell>
                        <TableCell className="font-semibold text-gray-900">
                          €{invoice.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-gray-600">{formatDate(invoice.issueDate)}</TableCell>
                        <TableCell className={overdueStatus ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                          {formatDate(invoice.dueDate)}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {invoice.paidDate ? formatDate(invoice.paidDate) : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(displayStatus)} transition-colors border ${overdueStatus ? 'animate-heartbeat' : ''}`}>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(displayStatus)}
                              <span className="font-medium">
                                {overdueStatus ? t('invoices.overdue') :
                                  invoice.status === 'paid' ? t('invoices.paid') :
                                    invoice.status === 'pending' ? t('invoices.pending') : invoice.status}
                              </span>
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEdit(invoice)} className="h-8 w-8 p-0">
                              <Edit className="h-3 w-3" />
                            </Button>

                            {invoice.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => markAsPaid(invoice)}
                                className="h-8 w-8 p-0 text-green-600 hover:bg-green-50 hover:border-green-200"
                              >
                                <CheckCircle className="h-3 w-3" />
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

            {filteredInvoices.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  {searchTerm || statusFilter.length > 0 || supplierFilter.length > 0 ||
                    issueDateStart || dueDateStart || minAmount || maxAmount
                    ? t('invoices.noFilterResults')
                    : t('invoices.noInvoices')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InvoiceManager;
