
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, AlertCircle, CheckCircle, Clock, Plus, Eye, Edit, Trash2, Search, Filter, Calendar, Euro, TrendingUp, Download, X } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';
import { InvoiceForm } from './InvoiceForm';

const InvoiceManager: React.FC = () => {
  const { t } = useLanguage();
  const { 
    invoices, 
    suppliers,
    stores,
    getSupplierById,
    getStoreById,
    getOverdueInvoices,
    updateInvoice,
    addInvoice
  } = useData();
  
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Filtros avançados
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [supplierFilter, setSupplierFilter] = useState<string[]>([]);
  const [storeFilter, setStoreFilter] = useState<string[]>([]);
  const [issueDateStart, setIssueDateStart] = useState('');
  const [issueDateEnd, setIssueDateEnd] = useState('');
  const [dueDateStart, setDueDateStart] = useState('');
  const [dueDateEnd, setDueDateEnd] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Helper functions - moved before useMemo hooks
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

  // Filtros aplicados
  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const supplier = getSupplierById(invoice.supplierId);
      const invoiceDate = new Date(invoice.issueDate);
      const dueDate = new Date(invoice.dueDate);
      
      // Busca livre
      const matchesSearch = !searchTerm || 
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier?.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status
      const currentStatus = isOverdue(invoice) ? 'overdue' : invoice.status;
      const matchesStatus = statusFilter.length === 0 || statusFilter.includes(currentStatus);
      
      // Fornecedor
      const matchesSupplier = supplierFilter.length === 0 || supplierFilter.includes(invoice.supplierId);
      
      // Loja (assumindo que temos storeId nas faturas, senão ignorar este filtro)
      const matchesStore = storeFilter.length === 0; // TODO: implementar quando tiver storeId
      
      // Data de emissão
      const matchesIssueDate = (!issueDateStart || invoiceDate >= new Date(issueDateStart)) &&
                              (!issueDateEnd || invoiceDate <= new Date(issueDateEnd));
      
      // Data de vencimento
      const matchesDueDate = (!dueDateStart || dueDate >= new Date(dueDateStart)) &&
                            (!dueDateEnd || dueDate <= new Date(dueDateEnd));
      
      // Valor
      const matchesAmount = (!minAmount || invoice.amount >= parseFloat(minAmount)) &&
                           (!maxAmount || invoice.amount <= parseFloat(maxAmount));
      
      return matchesSearch && matchesStatus && matchesSupplier && 
             matchesStore && matchesIssueDate && matchesDueDate && matchesAmount;
    });
  }, [invoices, searchTerm, statusFilter, supplierFilter, storeFilter, 
      issueDateStart, issueDateEnd, dueDateStart, dueDateEnd, minAmount, maxAmount]);

  // Estatísticas baseadas nos filtros
  const dashboardStats = useMemo(() => {
    const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const paidInvoices = filteredInvoices.filter(i => i.status === 'paid');
    const pendingInvoices = filteredInvoices.filter(i => i.status === 'pending');
    const overdueFiltered = filteredInvoices.filter(i => isOverdue(i));
    const averageAmount = filteredInvoices.length > 0 ? totalAmount / filteredInvoices.length : 0;
    
    return {
      totalInvoices: filteredInvoices.length,
      totalAmount,
      averageAmount,
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
    setStoreFilter([]);
    setIssueDateStart('');
    setIssueDateEnd('');
    setDueDateStart('');
    setDueDateEnd('');
    setMinAmount('');
    setMaxAmount('');
  };

  const markAsPaid = (invoice: any) => {
    updateInvoice(invoice.id, {
      status: 'paid',
      paidDate: new Date()
    });
    
    toast({
      title: "Fatura marcada como paga",
      description: `Fatura ${invoice.invoiceNumber} foi marcada como paga`,
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

  const toggleStatusFilter = (status: string) => {
    setStatusFilter(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const toggleSupplierFilter = (supplierId: string) => {
    setSupplierFilter(prev => 
      prev.includes(supplierId) 
        ? prev.filter(s => s !== supplierId)
        : [...prev, supplierId]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Gestão de Faturas
            </h1>
            <p className="text-gray-600">
              Controle completo de faturas com filtros avançados e analytics em tempo real
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={() => setShowFilters(!showFilters)} 
              variant={showFilters ? "default" : "outline"}
              className="shadow-md"
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
            </Button>
            <Button onClick={handleAddNew} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              Nova Fatura
            </Button>
          </div>
        </div>

        {/* Barra de Busca */}
        <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Buscar por número da fatura ou fornecedor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 text-lg border-gray-200 focus:border-blue-500 focus:ring-blue-200"
                />
              </div>
              <Button onClick={clearFilters} variant="outline" className="h-12 px-6">
                <X className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filtros Avançados */}
        {showFilters && (
          <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50">
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-blue-600" />
                Filtros Avançados
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Status */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700">Status</Label>
                  <div className="space-y-2">
                    {[
                      { value: 'paid', label: 'Pago', color: 'text-green-600' },
                      { value: 'pending', label: 'Pendente', color: 'text-yellow-600' },
                      { value: 'overdue', label: 'Vencido', color: 'text-red-600' }
                    ].map(status => (
                      <label key={status.value} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={statusFilter.includes(status.value)}
                          onChange={() => toggleStatusFilter(status.value)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className={`${status.color} font-medium`}>{status.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Fornecedor */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700">Fornecedores</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {suppliers.map(supplier => (
                      <label key={supplier.id} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={supplierFilter.includes(supplier.id)}
                          onChange={() => toggleSupplierFilter(supplier.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-gray-700">{supplier.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Data de Emissão */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700">Data de Emissão</Label>
                  <div className="space-y-2">
                    <Input
                      type="date"
                      placeholder="Data inicial"
                      value={issueDateStart}
                      onChange={(e) => setIssueDateStart(e.target.value)}
                      className="border-gray-200 focus:border-blue-500"
                    />
                    <Input
                      type="date"
                      placeholder="Data final"
                      value={issueDateEnd}
                      onChange={(e) => setIssueDateEnd(e.target.value)}
                      className="border-gray-200 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Data de Vencimento */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700">Data de Vencimento</Label>
                  <div className="space-y-2">
                    <Input
                      type="date"
                      placeholder="Data inicial"
                      value={dueDateStart}
                      onChange={(e) => setDueDateStart(e.target.value)}
                      className="border-gray-200 focus:border-blue-500"
                    />
                    <Input
                      type="date"
                      placeholder="Data final"
                      value={dueDateEnd}
                      onChange={(e) => setDueDateEnd(e.target.value)}
                      className="border-gray-200 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Valor */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700">Valor da Fatura (€)</Label>
                  <div className="space-y-2">
                    <Input
                      type="number"
                      placeholder="Valor mínimo"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                      className="border-gray-200 focus:border-blue-500"
                    />
                    <Input
                      type="number"
                      placeholder="Valor máximo"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                      className="border-gray-200 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dashboard de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total de Faturas</p>
                  <p className="text-3xl font-bold">{dashboardStats.totalInvoices}</p>
                  <p className="text-blue-100 text-sm mt-1">
                    €{dashboardStats.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <FileText className="h-10 w-10 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Pagas</p>
                  <p className="text-3xl font-bold">{dashboardStats.paidCount}</p>
                  <p className="text-green-100 text-sm mt-1">
                    €{dashboardStats.paidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <CheckCircle className="h-10 w-10 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-gradient-to-br from-yellow-500 to-orange-500 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">Pendentes</p>
                  <p className="text-3xl font-bold">{dashboardStats.pendingCount}</p>
                  <p className="text-yellow-100 text-sm mt-1">
                    €{dashboardStats.pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <Clock className="h-10 w-10 text-yellow-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Vencidas</p>
                  <p className="text-3xl font-bold">{dashboardStats.overdueCount}</p>
                  <p className="text-red-100 text-sm mt-1">
                    €{dashboardStats.overdueAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
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
                <span>Lista de Faturas</span>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {filteredInvoices.length} de {invoices.length}
                </Badge>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm font-normal text-gray-600">
                  Total: €{dashboardStats.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <Button size="sm" variant="outline" className="shadow-sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="font-semibold text-gray-700">Número</TableHead>
                    <TableHead className="font-semibold text-gray-700">Fornecedor</TableHead>
                    <TableHead className="font-semibold text-gray-700">Valor</TableHead>
                    <TableHead className="font-semibold text-gray-700">Emissão</TableHead>
                    <TableHead className="font-semibold text-gray-700">Vencimento</TableHead>
                    <TableHead className="font-semibold text-gray-700">Pagamento</TableHead>
                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                    <TableHead className="font-semibold text-gray-700">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id} className={`hover:bg-gray-50/50 transition-colors ${isOverdue(invoice) ? 'bg-red-50/30' : ''}`}>
                      <TableCell className="font-medium text-gray-900">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {getSupplierById(invoice.supplierId)?.name}
                      </TableCell>
                      <TableCell className="font-semibold text-gray-900">
                        €{invoice.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {formatDate(invoice.issueDate)}
                      </TableCell>
                      <TableCell className={isOverdue(invoice) ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                        {formatDate(invoice.dueDate)}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {invoice.paidDate ? formatDate(invoice.paidDate) : '-'}
                      </TableCell>
                      <TableCell>
                          <Badge className={`${getStatusColor(isOverdue(invoice) ? 'overdue' : invoice.status)} transition-colors border`}>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(isOverdue(invoice) ? 'overdue' : invoice.status)}
                              <span className="font-medium">
                                {isOverdue(invoice) ? 'Vencida' : 
                                 invoice.status === 'paid' ? 'Paga' : 
                                 invoice.status === 'pending' ? 'Pendente' : invoice.status}
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
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {filteredInvoices.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  {searchTerm || statusFilter.length > 0 || supplierFilter.length > 0 || 
                   issueDateStart || dueDateStart || minAmount || maxAmount
                    ? 'Nenhuma fatura encontrada com os filtros aplicados.'
                    : 'Nenhuma fatura cadastrada.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedInvoice ? 'Editar Fatura' : 'Nova Fatura'}
              </DialogTitle>
            </DialogHeader>
            <InvoiceForm 
              invoice={selectedInvoice}
              onClose={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default InvoiceManager;
