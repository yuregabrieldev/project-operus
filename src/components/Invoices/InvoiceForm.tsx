
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useData } from '@/contexts/DataContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';
import { Plus, Send, User, Clock } from 'lucide-react';

interface InvoiceFormProps {
  invoice?: any;
  onClose: () => void;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({ invoice, onClose }) => {
  const { t } = useLanguage();
  const { suppliers, stores, addInvoice, updateInvoice } = useData();

  const [formData, setFormData] = useState({
    invoiceNumber: '',
    supplierId: '',
    storeId: '',
    amount: '',
    currency: 'EUR',
    issueDate: '',
    dueDate: '',
    status: 'pending' as 'paid' | 'pending' | 'overdue',
    description: '',
    orderNumber: '',
    orderReceiptDate: '',
    orderReceiptTime: '',
    costCenter: '',
    directDebit: false,
    // Payment info
    paymentDate: '',
    paymentMethod: '',
    financialInstitution: '',
    markedAsPaid: false,
  });

  const [newObservation, setNewObservation] = useState('');
  const [observations, setObservations] = useState<Array<{ user: string; text: string; date: string }>>([]);

  useEffect(() => {
    if (invoice) {
      setFormData({
        invoiceNumber: invoice.invoiceNumber || '',
        supplierId: invoice.supplierId || '',
        storeId: invoice.storeId || '',
        amount: invoice.amount?.toString() || '',
        currency: invoice.currency || 'EUR',
        issueDate: invoice.issueDate ? new Date(invoice.issueDate).toISOString().split('T')[0] : '',
        dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '',
        status: invoice.status || 'pending',
        description: invoice.description || '',
        orderNumber: invoice.orderNumber || '',
        orderReceiptDate: invoice.orderReceiptDate ? new Date(invoice.orderReceiptDate).toISOString().split('T')[0] : '',
        orderReceiptTime: invoice.orderReceiptTime || '',
        costCenter: invoice.costCenter || '',
        directDebit: invoice.directDebit || false,
        paymentDate: invoice.paidDate ? new Date(invoice.paidDate).toISOString().split('T')[0] : '',
        paymentMethod: invoice.paymentMethod || '',
        financialInstitution: invoice.financialInstitution || '',
        markedAsPaid: invoice.status === 'paid',
      });
      setObservations(invoice.observations || []);
    }
  }, [invoice]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const invoiceData: any = {
      invoiceNumber: formData.invoiceNumber,
      supplierId: formData.supplierId,
      storeId: formData.storeId,
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      issueDate: new Date(formData.issueDate),
      dueDate: new Date(formData.dueDate),
      status: formData.markedAsPaid ? 'paid' : formData.status,
      description: formData.description,
      orderNumber: formData.orderNumber,
      costCenter: formData.costCenter,
      directDebit: formData.directDebit,
      paymentMethod: formData.paymentMethod,
      financialInstitution: formData.financialInstitution,
      observations,
    };

    if (formData.orderReceiptDate) {
      invoiceData.orderReceiptDate = new Date(formData.orderReceiptDate);
    }
    if (formData.markedAsPaid && formData.paymentDate) {
      invoiceData.paidDate = new Date(formData.paymentDate);
    }

    if (invoice) {
      updateInvoice(invoice.id, invoiceData);
      toast({
        title: t('invoices.updated'),
        description: t('invoices.invoice_updated_successfully'),
      });
    } else {
      addInvoice(invoiceData);
      toast({
        title: t('invoices.added'),
        description: t('invoices.invoice_added_successfully'),
      });
    }

    onClose();
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addObservation = () => {
    if (!newObservation.trim()) return;
    const obs = {
      user: 'Admin',
      text: newObservation,
      date: new Date().toLocaleString('pt-BR'),
    };
    setObservations(prev => [...prev, obs]);
    setNewObservation('');
  };

  // Section divider component
  const SectionTitle: React.FC<{ title: string; color?: string }> = ({ title, color = 'text-purple-700' }) => (
    <div className="pt-4 pb-2">
      <h3 className={`text-sm font-bold ${color} tracking-wider uppercase`}>{title}</h3>
      <div className="h-0.5 bg-gradient-to-r from-purple-200 to-transparent mt-1" />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Status Badge - Top Right */}
      <div className="flex justify-end">
        <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
          <SelectTrigger className={`w-48 font-semibold ${formData.status === 'paid' ? 'border-green-300 text-green-700 bg-green-50' :
              formData.status === 'pending' ? 'border-yellow-300 text-yellow-700 bg-yellow-50' :
                'border-red-300 text-red-700 bg-red-50'
            }`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">{t('invoices.pending')}</SelectItem>
            <SelectItem value="paid">{t('invoices.paid')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Store + Supplier Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold text-gray-700">{t('invoices.store')} *</Label>
          <Select value={formData.storeId} onValueChange={(v) => handleChange('storeId', v)}>
            <SelectTrigger className="bg-purple-50/50 border-purple-200 focus:border-purple-400">
              <SelectValue placeholder={t('invoices.selectStore')} />
            </SelectTrigger>
            <SelectContent>
              {stores.map(store => (
                <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold text-gray-700">
            {t('common.supplier')} *
            <span className="text-purple-600 text-xs ml-2 cursor-pointer hover:underline">+{t('invoices.new')}</span>
          </Label>
          <Select value={formData.supplierId} onValueChange={(v) => handleChange('supplierId', v)}>
            <SelectTrigger className="bg-white border-gray-200">
              <SelectValue placeholder={t('common.select_supplier')} />
            </SelectTrigger>
            <SelectContent>
              {suppliers.map(supplier => (
                <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Invoice Number + Issue + Due Dates */}
      <div className="p-4 rounded-lg border border-purple-100 bg-purple-50/30 space-y-3">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-gray-700">{t('invoices.number')}</Label>
            <Input
              value={formData.invoiceNumber}
              onChange={(e) => handleChange('invoiceNumber', e.target.value)}
              className="bg-white"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-gray-700">{t('invoices.issueDate')} *</Label>
            <Input
              type="date"
              value={formData.issueDate}
              onChange={(e) => handleChange('issueDate', e.target.value)}
              className="bg-white"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-gray-700">{t('invoices.dueDate')} *</Label>
            <Input
              type="date"
              value={formData.dueDate}
              onChange={(e) => handleChange('dueDate', e.target.value)}
              className="bg-white"
              required
            />
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.directDebit}
            onChange={(e) => handleChange('directDebit', e.target.checked)}
            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
          />
          <span className="text-sm font-medium text-red-600">✓ {t('invoices.directDebit')}</span>
        </label>
      </div>

      {/* Order Number + Receipt */}
      <div className="p-4 rounded-lg border border-gray-100 bg-gray-50/50">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-gray-700">{t('invoices.orderNumber')}</Label>
            <Input
              value={formData.orderNumber}
              onChange={(e) => handleChange('orderNumber', e.target.value)}
              className="bg-white"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-gray-700">{t('invoices.receiptDate')} *</Label>
            <Input
              type="date"
              value={formData.orderReceiptDate}
              onChange={(e) => handleChange('orderReceiptDate', e.target.value)}
              className="bg-white"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-gray-700">{t('invoices.receiptTime')}</Label>
            <Input
              type="time"
              value={formData.orderReceiptTime}
              onChange={(e) => handleChange('orderReceiptTime', e.target.value)}
              className="bg-white"
            />
          </div>
        </div>
      </div>

      {/* Cost Center */}
      <div className="p-4 rounded-lg border border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            📊 {t('invoices.costCenter')}
          </Label>
          <span className="text-purple-600 text-xs cursor-pointer hover:underline flex items-center gap-1">
            <Plus className="h-3 w-3" /> {t('invoices.add')}
          </span>
        </div>
        <Input
          value={formData.costCenter}
          onChange={(e) => handleChange('costCenter', e.target.value)}
          placeholder={t('invoices.costCenterPlaceholder')}
          className="bg-white"
        />
      </div>

      {/* Value */}
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold text-gray-700">{t('invoices.amount')}</Label>
        <div className="flex gap-2">
          <Select value={formData.currency} onValueChange={(v) => handleChange('currency', v)}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="BRL">BRL</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => handleChange('amount', e.target.value)}
            className="flex-1"
            required
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold text-gray-700">{t('invoices.descriptionLabel')} *</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder={t('invoices.descriptionPlaceholder')}
          className="min-h-[80px] resize-none"
        />
      </div>

      {/* Payment Information */}
      <SectionTitle title={t('invoices.paymentInfo')} color="text-purple-700" />
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold text-gray-700">{t('invoices.paymentDate')}</Label>
          <Input
            type="date"
            value={formData.paymentDate}
            onChange={(e) => handleChange('paymentDate', e.target.value)}
            className="bg-white"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold text-gray-700">{t('invoices.paymentMethod')}</Label>
          <Select value={formData.paymentMethod} onValueChange={(v) => handleChange('paymentMethod', v)}>
            <SelectTrigger>
              <SelectValue placeholder={t('invoices.paymentMethod')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="transfer">{t('invoices.bankTransfer')}</SelectItem>
              <SelectItem value="cash">{t('invoices.cash')}</SelectItem>
              <SelectItem value="card">{t('invoices.card')}</SelectItem>
              <SelectItem value="check">{t('invoices.check')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold text-gray-700">{t('invoices.financialInstitution')}</Label>
          <Input
            value={formData.financialInstitution}
            onChange={(e) => handleChange('financialInstitution', e.target.value)}
            placeholder={t('invoices.financialInstitution')}
            className="bg-white"
          />
        </div>
      </div>

      <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
        <div className={`w-10 h-5 rounded-full relative transition-colors ${formData.markedAsPaid ? 'bg-purple-600' : 'bg-gray-300'}`}>
          <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${formData.markedAsPaid ? 'left-5' : 'left-0.5'}`} />
        </div>
        <span className="text-sm font-medium text-gray-700">{t('invoices.markAsPaid')}</span>
      </label>

      {/* Observations */}
      <SectionTitle title={t('invoices.observationsTitle')} color="text-gray-700" />
      <div className="space-y-3">
        {observations.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {observations.map((obs, idx) => (
              <div key={idx} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{obs.user}: {obs.text}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3" /> {obs.date}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Input
            value={newObservation}
            onChange={(e) => setNewObservation(e.target.value)}
            placeholder={t('invoices.addObservation')}
            className="flex-1"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addObservation(); } }}
          />
          <Button type="button" onClick={addObservation} size="sm" className="bg-purple-600 hover:bg-purple-700 px-4">
            <Send className="h-4 w-4 mr-1" /> {t('invoices.add')}
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose} className="px-8">
          {t('common.cancel')}
        </Button>
        <Button type="submit" className="bg-purple-600 hover:bg-purple-700 px-8">
          {t('common.save')}
        </Button>
      </div>
    </form>
  );
};
