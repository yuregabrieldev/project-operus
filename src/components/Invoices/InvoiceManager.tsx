
import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DateInput } from '@/components/ui/date-input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, AlertCircle, CheckCircle, Clock, Plus, Edit, Search, Filter, Download, X, Calendar, ArrowLeft } from 'lucide-react';
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

  const navigate = useNavigate();
  const { lang = 'pt', invoiceId } = useParams<{ lang: string; invoiceId: string }>();

  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [scrollToPayment, setScrollToPayment] = useState(false);

  // Deep linking: sync URL :invoiceId with form state
  useEffect(() => {
    if (invoiceId) {
      if (invoiceId === 'nova') {
        setSelectedInvoice(null);
        setIsFormOpen(true);
      } else {
        const found = invoices.find((inv: any) => inv.id === invoiceId || inv.invoiceNumber === invoiceId);
        if (found) {
          setSelectedInvoice(found);
          setIsFormOpen(true);
        }
      }
    }
  }, [invoiceId, invoices]);

  // Filtros avançados
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [issueDatePreset, setIssueDatePreset] = useState('all');
  const [issueDateStart, setIssueDateStart] = useState('');
  const [issueDateEnd, setIssueDateEnd] = useState('');
  const [dueDatePreset, setDueDatePreset] = useState('all');
  const [dueDateStart, setDueDateStart] = useState('');
  const [dueDateEnd, setDueDateEnd] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Helper functions
  const isOverdue = (invoice: any) => {
    return invoice.status === 'contas_a_pagar' && new Date() > new Date(invoice.dueDate);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'finalizado_pago': return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100';
      case 'pedido_realizado': return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100';
      case 'contas_a_pagar': return 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100';
      case 'mercadoria_recebida': return 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100';
      case 'cancelado':
      case 'finalizado_outros':
      default: return 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'finalizado_pago': return <CheckCircle className="h-4 w-4" />;
      case 'pedido_realizado': return <Clock className="h-4 w-4" />;
      case 'contas_a_pagar': return <AlertCircle className="h-4 w-4" />;
      case 'mercadoria_recebida': return <FileText className="h-4 w-4" />;
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

  // No toggles needed — single-value filters now

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    const statusOrder: Record<string, number> = {
      contas_a_pagar: 0,
      mercadoria_recebida: 1,
      pedido_realizado: 2,
      finalizado_pago: 3,
      finalizado_outros: 4,
      cancelado: 5,
    };

    return invoices.filter(invoice => {
      const supplier = getSupplierById(invoice.supplierId);
      const invoiceDate = new Date(invoice.issueDate);
      const dueDate = new Date(invoice.dueDate);

      const matchesSearch = !searchTerm ||
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier?.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = !statusFilter || invoice.status === statusFilter;

      const matchesSupplier = !supplierFilter || invoice.supplierId === supplierFilter;

      const matchesIssueDate = (!issueDateStart || invoiceDate >= new Date(issueDateStart)) &&
        (!issueDateEnd || invoiceDate <= new Date(issueDateEnd + 'T23:59:59'));

      const matchesDueDate = (!dueDateStart || dueDate >= new Date(dueDateStart)) &&
        (!dueDateEnd || dueDate <= new Date(dueDateEnd + 'T23:59:59'));

      const matchesAmount = (!minAmount || invoice.amount >= parseFloat(minAmount)) &&
        (!maxAmount || invoice.amount <= parseFloat(maxAmount));

      return matchesSearch && matchesStatus && matchesSupplier &&
        matchesIssueDate && matchesDueDate && matchesAmount;
    }).sort((a, b) => {
      const issueDiff = new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime();
      if (issueDiff !== 0) return issueDiff;

      const dueDiff = new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
      if (dueDiff !== 0) return dueDiff;

      return (statusOrder[a.status] ?? 999) - (statusOrder[b.status] ?? 999);
    });
  }, [invoices, searchTerm, statusFilter, supplierFilter,
    issueDateStart, issueDateEnd, dueDateStart, dueDateEnd, minAmount, maxAmount]);

  // Stats
  const dashboardStats = useMemo(() => {
    const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const paidInvoices = filteredInvoices.filter(i => i.status === 'finalizado_pago');
    const pendingInvoices = filteredInvoices.filter(i => i.status === 'pedido_realizado' || i.status === 'mercadoria_recebida');
    const overdueFiltered = filteredInvoices.filter(i => i.status === 'contas_a_pagar');

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
    setStatusFilter('');
    setSupplierFilter('');
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
    // Open edit page with status = finalizado_pago and scroll to payment
    const paidInvoice = { ...invoice, status: 'finalizado_pago' };
    setSelectedInvoice(paidInvoice);
    setScrollToPayment(true);
    setIsFormOpen(true);
  };

  const handleEdit = (invoice: any) => {
    setSelectedInvoice(invoice);
    setScrollToPayment(false);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedInvoice(null);
    setScrollToPayment(false);
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
      const statusLabelsCSV: Record<string, string> = {
        'pedido_realizado': 'Pedido Realizado',
        'mercadoria_recebida': 'Mercadoria Recebida',
        'contas_a_pagar': 'Contas a Pagar',
        'finalizado_pago': 'Pago',
        'cancelado': 'Cancelado',
        'finalizado_outros': 'Finalizado Outros',
      };
      const currentStatus = statusLabelsCSV[invoice.status] || invoice.status;

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

  // Labels not needed for single-select — we use Select with SelectValue

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
      <div className="min-h-screen bg-background">
        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
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
              <h1 className="text-lg font-bold text-foreground">
                {selectedInvoice ? t('invoices.editInvoice') : t('invoices.newInvoice')}
              </h1>
              {selectedInvoice && (
                <p className="text-sm text-muted-foreground">
                  {t('invoices.number')}: {selectedInvoice.invoiceNumber}
                </p>
              )}
            </div>
          </div>

          {/* Form Card */}
          <Card>
            <CardContent className="p-8">
              <InvoiceForm
                invoice={selectedInvoice}
                onClose={() => { setIsFormOpen(false); setScrollToPayment(false); }}
                scrollToPayment={scrollToPayment}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {t('invoices.title')}
            </h1>
            <p className="text-muted-foreground">{t('invoices.description')}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant={showFilters ? "default" : "outline"}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? t('invoices.hideFilters') : t('invoices.showFilters')}
            </Button>
            <Button onClick={handleAddNew} className="shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              {t('invoices.newInvoice')}
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <Card>
          <CardContent className="p-3 md:p-6">
            <div className="flex gap-2 md:gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 md:h-5 md:w-5" />
                <Input
                  placeholder={t('invoices.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 text-sm md:pl-12 md:h-12 md:text-lg"
                />
              </div>
              <Button onClick={clearFilters} variant="outline" className="h-10 px-4 text-sm md:h-12 md:px-6">
                <X className="h-4 w-4 mr-2" />
                {t('invoices.clearFilters')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Filters */}
        {showFilters && (
          <Card>
            <CardHeader className="bg-muted/50">
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                {t('invoices.advancedFilters')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Status Dropdown */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">{t('common.status')}</Label>
                  <Select value={statusFilter || '__all__'} onValueChange={(v) => setStatusFilter(v === '__all__' ? '' : v)}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">{t('invoices.allStatuses')}</SelectItem>
                      <SelectItem value="pedido_realizado">
                        <span className="text-yellow-600">{t('invoices.status_pedido_realizado')}</span>
                      </SelectItem>
                      <SelectItem value="mercadoria_recebida">
                        <span className="text-blue-600">{t('invoices.status_mercadoria_recebida')}</span>
                      </SelectItem>
                      <SelectItem value="contas_a_pagar">
                        <span className="text-red-600">{t('invoices.status_contas_a_pagar')}</span>
                      </SelectItem>
                      <SelectItem value="finalizado_pago">
                        <span className="text-green-600">{t('invoices.status_finalizado_pago')}</span>
                      </SelectItem>
                      <SelectItem value="cancelado">
                        <span className="text-muted-foreground">{t('invoices.status_cancelado')}</span>
                      </SelectItem>
                      <SelectItem value="finalizado_outros">
                        <span className="text-muted-foreground">{t('invoices.status_finalizado_outros')}</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Supplier Dropdown */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">{t('invoices.supplierFilter')}</Label>
                  <Select value={supplierFilter || '__all__'} onValueChange={(v) => setSupplierFilter(v === '__all__' ? '' : v)}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">{t('invoices.allSuppliers')}</SelectItem>
                      {suppliers.map(supplier => (
                        <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Issue Date Dynamic Dropdown */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">{t('invoices.issueDate')}</Label>
                  <Select value={issueDatePreset} onValueChange={handleIssueDatePreset}>
                    <SelectTrigger className="h-10">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
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
                      <DateInput value={issueDateStart} onChange={(e) => setIssueDateStart(e.target.value)} className="text-sm" />
                      <DateInput value={issueDateEnd} onChange={(e) => setIssueDateEnd(e.target.value)} className="text-sm" />
                    </div>
                  )}
                </div>

                {/* Due Date Dynamic Dropdown */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">{t('invoices.dueDate')}</Label>
                  <Select value={dueDatePreset} onValueChange={handleDueDatePreset}>
                    <SelectTrigger className="h-10">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
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
                      <DateInput value={dueDateStart} onChange={(e) => setDueDateStart(e.target.value)} className="text-sm" />
                      <DateInput value={dueDateEnd} onChange={(e) => setDueDateEnd(e.target.value)} className="text-sm" />
                    </div>
                  )}
                </div>

                {/* Amount Range */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">{t('invoices.amountRange')}</Label>
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
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          <Card className="bg-primary/5 border-primary/10">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary/70 text-sm font-medium">{t('invoices.totalInvoices')}</p>
                  <p className="text-3xl font-bold text-primary">{dashboardStats.totalInvoices}</p>
                  <p className="text-primary/60 text-sm mt-1">€{dashboardStats.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <FileText className="h-10 w-10 text-primary/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-emerald-50/50 border-emerald-100">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-600 text-sm font-medium">{t('invoices.paidLabel')}</p>
                  <p className="text-3xl font-bold text-emerald-700">{dashboardStats.paidCount}</p>
                  <p className="text-emerald-600/60 text-sm mt-1">€{dashboardStats.paidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <CheckCircle className="h-10 w-10 text-emerald-600/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-amber-50/50 border-amber-100">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-600 text-sm font-medium">{t('invoices.pendingLabel')}</p>
                  <p className="text-3xl font-bold text-amber-700">{dashboardStats.pendingCount}</p>
                  <p className="text-amber-600/60 text-sm mt-1">€{dashboardStats.pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <Clock className="h-10 w-10 text-amber-600/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-rose-50/50 border-rose-100">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-rose-600 text-sm font-medium">{t('invoices.overdueLabel')}</p>
                  <p className="text-3xl font-bold text-rose-700">{dashboardStats.overdueCount}</p>
                  <p className="text-rose-600/60 text-sm mt-1">€{dashboardStats.overdueAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <AlertCircle className="h-10 w-10 text-rose-600/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoices Table */}
        <Card>
          <CardHeader className="bg-muted/50 border-b">
            <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                <FileText className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                <span className="text-base md:text-lg">{t('invoices.listTitle')}</span>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
                  {filteredInvoices.length} de {invoices.length}
                </Badge>
              </div>
              <div className="flex items-center gap-2 md:gap-4">
                <div className="text-xs md:text-sm font-normal text-muted-foreground hidden sm:block">
                  Total: €{dashboardStats.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <Button size="sm" variant="outline" className="shadow-sm" onClick={exportCSV}>
                  <Download className="h-4 w-4 mr-1 md:mr-2" />
                  {t('invoices.export')}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">{t('invoices.number')}</TableHead>
                    <TableHead className="font-semibold">{t('invoices.supplierFilter')}</TableHead>
                    <TableHead className="font-semibold">{t('invoices.amount')}</TableHead>
                    <TableHead className="font-semibold">{t('invoices.issueDate')}</TableHead>
                    <TableHead className="font-semibold">{t('invoices.dueDate')}</TableHead>
                    <TableHead className="font-semibold">{t('invoices.paymentDate')}</TableHead>
                    <TableHead className="font-semibold">{t('common.status')}</TableHead>
                    <TableHead className="font-semibold">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => {
                    const overdueStatus = isOverdue(invoice);
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
                          <Badge className={`${getStatusColor(invoice.status)} transition-colors border whitespace-nowrap ${overdueStatus ? 'animate-heartbeat' : ''}`}>
                            <div className="flex items-center gap-1.5">
                              {getStatusIcon(invoice.status)}
                              <span className="font-medium text-xs">
                                {t(`invoices.status_${invoice.status}`)}
                              </span>
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEdit(invoice)} className="h-8 w-8 p-0">
                              <Edit className="h-3 w-3" />
                            </Button>

                            {invoice.status !== 'finalizado_pago' && invoice.status !== 'cancelado' && (
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
                  {searchTerm || statusFilter || supplierFilter ||
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
