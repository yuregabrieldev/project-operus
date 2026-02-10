
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useData } from '@/contexts/DataContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';

interface InvoiceFormProps {
  invoice?: any;
  onClose: () => void;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({ invoice, onClose }) => {
  const { t } = useLanguage();
  const { suppliers, addInvoice, updateInvoice } = useData();
  
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    supplierId: '',
    amount: '',
    issueDate: '',
    dueDate: '',
    status: 'pending' as 'paid' | 'pending' | 'overdue'
  });

  useEffect(() => {
    if (invoice) {
      setFormData({
        invoiceNumber: invoice.invoiceNumber,
        supplierId: invoice.supplierId,
        amount: invoice.amount.toString(),
        issueDate: new Date(invoice.issueDate).toISOString().split('T')[0],
        dueDate: new Date(invoice.dueDate).toISOString().split('T')[0],
        status: invoice.status
      });
    }
  }, [invoice]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const invoiceData = {
      invoiceNumber: formData.invoiceNumber,
      supplierId: formData.supplierId,
      amount: parseFloat(formData.amount),
      issueDate: new Date(formData.issueDate),
      dueDate: new Date(formData.dueDate),
      status: formData.status,
      ...(formData.status === 'paid' && { paidDate: new Date() })
    };

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

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('invoices.number')}
          </label>
          <input
            type="text"
            value={formData.invoiceNumber}
            onChange={(e) => handleChange('invoiceNumber', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('common.supplier')}
          </label>
          <select
            value={formData.supplierId}
            onChange={(e) => handleChange('supplierId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">{t('common.select_supplier')}</option>
            {suppliers.map(supplier => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('invoices.amount')}
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => handleChange('amount', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('common.status')}
          </label>
          <select
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="pending">{t('invoices.pending')}</option>
            <option value="paid">{t('invoices.paid')}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('invoices.issue_date')}
          </label>
          <input
            type="date"
            value={formData.issueDate}
            onChange={(e) => handleChange('issueDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('invoices.due_date')}
          </label>
          <input
            type="date"
            value={formData.dueDate}
            onChange={(e) => handleChange('dueDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          {invoice ? t('common.update') : t('common.add')}
        </Button>
      </div>
    </form>
  );
};
