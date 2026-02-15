
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useData } from '@/contexts/DataContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';
import { Plus, Send, User, Clock, Trash2, Download, Eye, FileText, Upload, FileDown } from 'lucide-react';
import type { InvoiceStatus } from '@/contexts/DataContext';

interface InvoiceFormProps {
  invoice?: any;
  onClose: () => void;
  scrollToPayment?: boolean;
}

// Status definitions
const INVOICE_STATUSES: InvoiceStatus[] = [
  'pedido_realizado',
  'mercadoria_recebida',
  'contas_a_pagar',
  'finalizado_pago',
  'cancelado',
  'finalizado_outros',
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'finalizado_pago': return 'border-green-300 text-green-700 bg-green-50';
    case 'pedido_realizado': return 'border-yellow-300 text-yellow-700 bg-yellow-50';
    case 'contas_a_pagar': return 'border-red-300 text-red-700 bg-red-50';
    case 'mercadoria_recebida': return 'border-blue-300 text-blue-700 bg-blue-50';
    case 'cancelado':
    case 'finalizado_outros':
    default: return 'border-gray-300 text-gray-700 bg-gray-50';
  }
};

// Attachment file types
const ATTACHMENT_TYPES = ['Fatura', 'Recibo', 'Pedido', 'Comprovante', 'Outro'];

interface AttachmentFile {
  id: string;
  name: string;
  type: string; // Fatura, Recibo, etc.
  dataUrl: string;
  mimeType: string;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({ invoice, onClose, scrollToPayment = false }) => {
  const { t } = useLanguage();
  const { suppliers, stores, costCenters, addInvoice, updateInvoice, addSupplier, deleteSupplier, addCostCenter, deleteCostCenter } = useData();

  const paymentSectionRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    invoiceNumber: '',
    supplierId: '',
    storeId: '',
    amount: '',
    currency: 'EUR',
    issueDate: '',
    dueDate: '',
    status: 'pedido_realizado' as InvoiceStatus,
    description: '',
    orderNumber: '',
    orderReceiptDate: '',
    orderReceiptTime: '',
    costCenter: '',
    directDebit: false,
    paymentDate: '',
    paymentMethod: '',
    financialInstitution: '',
    markedAsPaid: false,
  });

  // Store initial form data for diff on save
  const initialFormRef = useRef<typeof formData | null>(null);

  const [newObservation, setNewObservation] = useState('');
  const [observations, setObservations] = useState<Array<{ user: string; text: string; date: string }>>([]);

  // Attachments
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cost Center popup states
  const [showCostCenterPopup, setShowCostCenterPopup] = useState(false);
  const [ccSearchTerm, setCcSearchTerm] = useState('');
  const [ccFormView, setCcFormView] = useState(false); // false = search list, true = código+descrição form
  const [ccDescription, setCcDescription] = useState('');

  // Supplier popup states
  const [showSupplierPopup, setShowSupplierPopup] = useState(false);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState('');

  // Computed: filtered cost centers
  const filteredCostCenters = costCenters.filter(cc =>
    !ccSearchTerm || cc.name.toLowerCase().includes(ccSearchTerm.toLowerCase())
  );
  const ccExistsExact = costCenters.some(cc =>
    cc.name.toLowerCase() === ccSearchTerm.toLowerCase() ||
    cc.name.toLowerCase().startsWith(ccSearchTerm.toLowerCase() + ' -')
  );

  // Computed: filtered suppliers
  const filteredSuppliers = suppliers.filter(s =>
    !supplierSearchTerm || s.name.toLowerCase().includes(supplierSearchTerm.toLowerCase())
  );
  const supplierExistsExact = suppliers.some(s =>
    s.name.toLowerCase() === supplierSearchTerm.toLowerCase()
  );

  useEffect(() => {
    if (invoice) {
      const data = {
        invoiceNumber: invoice.invoiceNumber || '',
        supplierId: invoice.supplierId || '',
        storeId: invoice.storeId || '',
        amount: invoice.amount?.toString() || '',
        currency: invoice.currency || 'EUR',
        issueDate: invoice.issueDate ? new Date(invoice.issueDate).toISOString().split('T')[0] : '',
        dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '',
        status: (invoice.status || 'pedido_realizado') as InvoiceStatus,
        description: invoice.description || '',
        orderNumber: invoice.orderNumber || '',
        orderReceiptDate: invoice.orderReceiptDate ? new Date(invoice.orderReceiptDate).toISOString().split('T')[0] : '',
        orderReceiptTime: invoice.orderReceiptTime || '',
        costCenter: invoice.costCenter || '',
        directDebit: invoice.directDebit || false,
        paymentDate: invoice.paidDate ? new Date(invoice.paidDate).toISOString().split('T')[0] : '',
        paymentMethod: invoice.paymentMethod || '',
        financialInstitution: invoice.financialInstitution || '',
        markedAsPaid: invoice.status === 'finalizado_pago',
      };
      setFormData(data);
      initialFormRef.current = { ...data };
      setObservations(invoice.observations || []);
    } else {
      initialFormRef.current = { ...formData };
    }
  }, [invoice]);

  // Scroll to payment section on mount when scrollToPayment prop is true
  useEffect(() => {
    if (scrollToPayment && paymentSectionRef.current) {
      setTimeout(() => {
        paymentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [scrollToPayment]);

  // Status ↔ Toggle sync
  const handleStatusChange = (status: InvoiceStatus) => {
    const isPaid = status === 'finalizado_pago';
    setFormData(prev => ({ ...prev, status, markedAsPaid: isPaid }));
  };

  const handleTogglePaid = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      markedAsPaid: checked,
      status: checked ? 'finalizado_pago' : (prev.status === 'finalizado_pago' ? 'pedido_realizado' : prev.status),
    }));
  };

  // Field labels for diff observations
  const fieldLabels: Record<string, string> = {
    invoiceNumber: t('invoices.number'),
    supplierId: t('common.supplier'),
    storeId: t('invoices.store'),
    amount: t('invoices.amount'),
    currency: 'Moeda',
    issueDate: t('invoices.issueDate'),
    dueDate: t('invoices.dueDate'),
    status: 'Status',
    description: t('invoices.descriptionLabel'),
    orderNumber: t('invoices.orderNumber'),
    costCenter: t('invoices.costCenter'),
    directDebit: t('invoices.directDebit'),
    paymentDate: t('invoices.paymentDate'),
    paymentMethod: t('invoices.paymentMethod'),
    financialInstitution: t('invoices.financialInstitution'),
  };

  const getStatusLabel = (status: string) => {
    return t(`invoices.status_${status}`) || status;
  };

  const generateDiffObservations = (): Array<{ user: string; text: string; date: string }> => {
    if (!initialFormRef.current) return [];
    const diffs: string[] = [];
    const initial = initialFormRef.current;
    const current = formData;
    const now = new Date().toLocaleString('pt-BR');

    const fieldsToCheck = Object.keys(fieldLabels);
    for (const field of fieldsToCheck) {
      const oldVal = (initial as any)[field];
      const newVal = (current as any)[field];
      if (String(oldVal) !== String(newVal)) {
        const label = fieldLabels[field] || field;
        let displayOld = String(oldVal || '-');
        let displayNew = String(newVal || '-');

        if (field === 'status') {
          displayOld = getStatusLabel(oldVal);
          displayNew = getStatusLabel(newVal);
        } else if (field === 'supplierId') {
          displayOld = suppliers.find(s => s.id === oldVal)?.name || displayOld;
          displayNew = suppliers.find(s => s.id === newVal)?.name || displayNew;
        } else if (field === 'storeId') {
          displayOld = stores.find(s => s.id === oldVal)?.name || displayOld;
          displayNew = stores.find(s => s.id === newVal)?.name || displayNew;
        } else if (field === 'directDebit') {
          displayOld = oldVal ? 'Sim' : 'Não';
          displayNew = newVal ? 'Sim' : 'Não';
        }

        diffs.push(`${label}: ${displayOld} → ${displayNew}`);
      }
    }

    if (diffs.length === 0) return [];
    return [{
      user: 'Admin',
      text: diffs.join(' | '),
      date: now,
    }];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation: if paid, payment fields required
    const isPaid = formData.status === 'finalizado_pago' || formData.markedAsPaid;
    if (isPaid && (!formData.paymentDate || !formData.paymentMethod)) {
      toast({
        title: t('invoices.validationError'),
        description: t('invoices.paymentFieldsRequired'),
        variant: 'destructive',
      });
      return;
    }

    // Validation: if payment fields filled, must be paid
    const hasPaymentInfo = formData.paymentDate || formData.paymentMethod || formData.financialInstitution;
    if (hasPaymentInfo && formData.status !== 'finalizado_pago') {
      toast({
        title: t('invoices.validationError'),
        description: t('invoices.mustBePaidIfPaymentFilled'),
        variant: 'destructive',
      });
      return;
    }

    // Generate auto-observations from diff
    const autoObs = invoice ? generateDiffObservations() : [];
    const allObservations = [...observations, ...autoObs];

    const finalStatus: InvoiceStatus = formData.markedAsPaid ? 'finalizado_pago' : formData.status;

    const invoiceData: any = {
      invoiceNumber: formData.invoiceNumber,
      supplierId: formData.supplierId,
      storeId: formData.storeId,
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      issueDate: new Date(formData.issueDate),
      dueDate: new Date(formData.dueDate),
      status: finalStatus,
      description: formData.description,
      orderNumber: formData.orderNumber,
      costCenter: formData.costCenter,
      directDebit: formData.directDebit,
      paymentMethod: formData.paymentMethod,
      financialInstitution: formData.financialInstitution,
      observations: allObservations,
    };

    if (formData.orderReceiptDate) {
      invoiceData.orderReceiptDate = new Date(formData.orderReceiptDate);
    }
    if (finalStatus === 'finalizado_pago' && formData.paymentDate) {
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

  // === Cost Center handlers ===
  const handleCcClickItem = (ccName: string) => {
    handleChange('costCenter', ccName);
    setShowCostCenterPopup(false);
    setCcSearchTerm('');
    setCcFormView(false);
  };

  const handleCcPlusClick = () => {
    setCcFormView(true);
    setCcDescription('');
  };

  const handleCcSave = () => {
    if (!ccSearchTerm.trim() || !ccDescription.trim()) return;
    const name = `${ccSearchTerm.trim()} - ${ccDescription.trim()}`;
    addCostCenter({ name });
    handleChange('costCenter', name);
    setShowCostCenterPopup(false);
    setCcSearchTerm('');
    setCcDescription('');
    setCcFormView(false);
  };

  const handleCcCancel = () => {
    setCcFormView(false);
    setCcDescription('');
  };

  // === Supplier handlers ===
  const handleSupplierClickItem = (supplierId: string) => {
    handleChange('supplierId', supplierId);
    setShowSupplierPopup(false);
    setSupplierSearchTerm('');
  };

  const handleAddSupplier = () => {
    if (!supplierSearchTerm.trim()) return;
    addSupplier({ name: supplierSearchTerm.trim(), contact: '', email: '' });
    // Find the newly added supplier and select it
    setTimeout(() => {
      const found = suppliers.find(s => s.name === supplierSearchTerm.trim());
      if (found) handleChange('supplierId', found.id);
    }, 50);
    setSupplierSearchTerm('');
  };

  // === Attachment handlers ===
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const attachment: AttachmentFile = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          name: file.name,
          type: 'Fatura',
          dataUrl: reader.result as string,
          mimeType: file.type,
        };
        setAttachments(prev => [...prev, attachment]);
      };
      reader.readAsDataURL(file);
    });
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleViewAttachment = (attachment: AttachmentFile) => {
    const newWindow = window.open();
    if (newWindow) {
      if (attachment.mimeType.startsWith('image/')) {
        newWindow.document.write(`<img src="${attachment.dataUrl}" style="max-width:100%" />`);
      } else {
        newWindow.document.write(`<iframe src="${attachment.dataUrl}" style="width:100%;height:100%;border:none;" />`);
      }
    }
  };

  const handleDownloadAttachment = (attachment: AttachmentFile) => {
    const link = document.createElement('a');
    link.href = attachment.dataUrl;
    link.download = attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAsPdf = (attachment: AttachmentFile) => {
    // For images, create a simple HTML-to-print PDF approach
    const printWindow = window.open();
    if (printWindow) {
      printWindow.document.write(`
        <html><head><title>${attachment.name}</title><style>
          body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
          img { max-width: 100%; max-height: 100vh; }
        </style></head><body>
          <img src="${attachment.dataUrl}" />
          <script>setTimeout(() => { window.print(); }, 500);</script>
        </body></html>
      `);
    }
  };

  const handleAttachmentTypeChange = (id: string, type: string) => {
    setAttachments(prev => prev.map(a => a.id === id ? { ...a, type } : a));
  };

  // Section divider
  const SectionTitle: React.FC<{ title: string; color?: string }> = ({ title, color = 'text-primary' }) => (
    <div className="pt-4 pb-2">
      <h3 className={`text-sm font-bold ${color} tracking-wider uppercase`}>{title}</h3>
      <div className="h-0.5 bg-gradient-to-r from-primary/20 to-transparent mt-1" />
    </div>
  );

  const isPaid = formData.status === 'finalizado_pago';

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Status Badge - Top Right */}
        <div className="flex justify-end">
          <Select value={formData.status} onValueChange={(v) => handleStatusChange(v as InvoiceStatus)}>
            <SelectTrigger className={`w-56 font-semibold ${getStatusColor(formData.status)}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INVOICE_STATUSES.map(s => (
                <SelectItem key={s} value={s}>
                  <span className={`inline-flex items-center gap-2 ${getStatusColor(s).split(' ').find(c => c.startsWith('text-')) || ''}`}>
                    {t(`invoices.status_${s}`)}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Store + Supplier Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">{t('invoices.store')} *</Label>
            <Select value={formData.storeId} onValueChange={(v) => handleChange('storeId', v)}>
              <SelectTrigger className="bg-primary/5 border-primary/20 focus:border-primary">
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
            <Label className="text-sm font-semibold flex items-center gap-2">
              {t('common.supplier')} *
              <span
                className="text-primary text-xs cursor-pointer hover:underline"
                onClick={() => setShowSupplierPopup(true)}
              >
                +{t('invoices.new')}
              </span>
            </Label>
            <Select value={formData.supplierId} onValueChange={(v) => handleChange('supplierId', v)}>
              <SelectTrigger>
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
        <div className="p-4 rounded-lg border border-primary/10 bg-primary/5 space-y-3">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">{t('invoices.number')}</Label>
              <Input
                value={formData.invoiceNumber}
                onChange={(e) => handleChange('invoiceNumber', e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">{t('invoices.issueDate')} *</Label>
              <Input
                type="date"
                value={formData.issueDate}
                onChange={(e) => handleChange('issueDate', e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">{t('invoices.dueDate')} *</Label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleChange('dueDate', e.target.value)}
                required
              />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.directDebit}
              onChange={(e) => handleChange('directDebit', e.target.checked)}
              className="w-4 h-4 text-primary rounded focus:ring-primary"
            />
            <span className="text-sm font-medium text-destructive">✓ {t('invoices.directDebit')}</span>
          </label>
        </div>

        {/* Order Number + Receipt */}
        <div className="p-4 rounded-lg border border-border bg-muted/50">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">{t('invoices.orderNumber')}</Label>
              <Input
                value={formData.orderNumber}
                onChange={(e) => handleChange('orderNumber', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">{t('invoices.receiptDate')} *</Label>
              <Input
                type="date"
                value={formData.orderReceiptDate}
                onChange={(e) => handleChange('orderReceiptDate', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">{t('invoices.receiptTime')}</Label>
              <Input
                type="time"
                value={formData.orderReceiptTime}
                onChange={(e) => handleChange('orderReceiptTime', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Cost Center - Dropdown */}
        <div className="p-4 rounded-lg border border-border bg-muted/50">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              📊 {t('invoices.costCenter')}
            </Label>
            <span
              className="text-primary text-xs cursor-pointer hover:underline flex items-center gap-1"
              onClick={() => { setShowCostCenterPopup(true); setCcSearchTerm(''); setCcFormView(false); }}
            >
              <Plus className="h-3 w-3" /> {t('invoices.add')}
            </span>
          </div>
          <Select value={formData.costCenter} onValueChange={(v) => handleChange('costCenter', v)}>
            <SelectTrigger>
              <SelectValue placeholder={t('invoices.costCenterPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {costCenters.map(cc => (
                <SelectItem key={cc.id} value={cc.name}>{cc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Value */}
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">{t('invoices.amount')}</Label>
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
          <Label className="text-sm font-semibold">{t('invoices.descriptionLabel')} *</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder={t('invoices.descriptionPlaceholder')}
            className="min-h-[80px] resize-none"
          />
        </div>

        {/* Attachments Section */}
        <SectionTitle title={t('invoices.attachmentsTitle')} color="text-primary" />
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="border-primary/20 text-primary hover:bg-primary/5"
            >
              <Upload className="h-4 w-4 mr-1" /> + {t('invoices.addFile')}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileUpload}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            />
          </div>

          {attachments.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {attachments.map(att => (
                <div key={att.id} className="p-3 border border-gray-200 rounded-lg bg-white space-y-2">
                  <p className="text-xs font-medium truncate" title={att.name}>{att.name}</p>
                  <div className="flex justify-center">
                    <FileText className="h-10 w-10 text-primary/40" />
                  </div>
                  {/* Type dropdown */}
                  <select
                    value={att.type}
                    onChange={(e) => handleAttachmentTypeChange(att.id, e.target.value)}
                    className="w-full text-xs border border-border rounded px-2 py-1 bg-background"
                  >
                    {ATTACHMENT_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {/* Action icons */}
                  <div className="flex items-center justify-center gap-2 pt-1">
                    {att.mimeType.startsWith('image/') && (
                      <button
                        type="button"
                        onClick={() => handleDownloadAsPdf(att)}
                        className="text-primary hover:text-primary/80 transition-colors"
                        title={t('invoices.downloadAsPdf')}
                      >
                        <FileDown className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDownloadAttachment(att)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      title={t('invoices.download')}
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleViewAttachment(att)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      title={t('invoices.view')}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAttachment(att.id)}
                      className="text-destructive hover:text-destructive/80 transition-colors"
                      title={t('common.delete')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Information */}
        <div ref={paymentSectionRef}>
          <SectionTitle title={t('invoices.paymentInfo')} color="text-primary" />
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">
                {t('invoices.paymentDate')} {isPaid && <span className="text-destructive">*</span>}
              </Label>
              <Input
                type="date"
                value={formData.paymentDate}
                onChange={(e) => handleChange('paymentDate', e.target.value)}
                required={isPaid}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">
                {t('invoices.paymentMethod')} {isPaid && <span className="text-destructive">*</span>}
              </Label>
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
              <Label className="text-sm font-semibold">{t('invoices.financialInstitution')}</Label>
              <Input
                value={formData.financialInstitution}
                onChange={(e) => handleChange('financialInstitution', e.target.value)}
                placeholder={t('invoices.financialInstitution')}
              />
            </div>
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-muted/50 transition-colors">
          <div className={`w-10 h-5 rounded-full relative transition-colors ${formData.markedAsPaid ? 'bg-primary' : 'bg-muted'}`}>
            <div className={`w-4 h-4 bg-background rounded-full absolute top-0.5 transition-all shadow-sm ${formData.markedAsPaid ? 'left-5' : 'left-0.5'}`} />
          </div>
          <span className="text-sm font-medium">{t('invoices.markAsPaid')}</span>
          <input type="checkbox" className="sr-only" checked={formData.markedAsPaid} onChange={(e) => handleTogglePaid(e.target.checked)} />
        </label>

        {/* Observations */}
        <SectionTitle title={t('invoices.observationsTitle')} color="text-muted-foreground" />
        <div className="space-y-3">
          {observations.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {observations.map((obs, idx) => (
                <div key={idx} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{obs.user}: {obs.text}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
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
            <Button type="button" onClick={addObservation} size="sm" className="bg-primary hover:bg-primary/90 px-4">
              <Send className="h-4 w-4 mr-1" /> {t('invoices.add')}
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose} className="px-8">
            {t('common.cancel')}
          </Button>
          <Button type="submit" className="bg-primary hover:bg-primary/90 px-8">
            {t('common.save')}
          </Button>
        </div>
      </form>

      {/* ============ Cost Center Popup ============ */}
      <Dialog open={showCostCenterPopup} onOpenChange={(open) => { setShowCostCenterPopup(open); if (!open) { setCcSearchTerm(''); setCcFormView(false); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-bold">
              {t('invoices.registerCostCenter')}
            </DialogTitle>
          </DialogHeader>

          {!ccFormView ? (
            // === Search + List View ===
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={ccSearchTerm}
                  onChange={(e) => setCcSearchTerm(e.target.value)}
                  placeholder={t('invoices.costCenterPlaceholder')}
                  className="flex-1 border-purple-300 focus:border-purple-500"
                />
                <Button
                  type="button"
                  onClick={handleCcPlusClick}
                  size="icon"
                  disabled={!ccSearchTerm.trim() || ccExistsExact}
                  className="bg-purple-600 hover:bg-purple-700 rounded-full w-10 h-10 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredCostCenters.length > 0 ? (
                  filteredCostCenters.map(cc => (
                    <div
                      key={cc.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white cursor-pointer hover:border-purple-300 hover:bg-purple-50/50 transition-colors"
                      onClick={() => handleCcClickItem(cc.name)}
                    >
                      <span className="text-sm font-medium text-gray-800">{cc.name}</span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); deleteCostCenter(cc.id); }}
                        className="text-purple-600 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-400">
                    <p className="text-sm">{t('invoices.noResults')}</p>
                    <p className="text-xs">{t('invoices.createCostCenter')}</p>
                  </div>
                )}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCostCenterPopup(false)}
                className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                {t('invoices.goBack')}
              </Button>
            </div>
          ) : (
            // === Código + Descrição Form View ===
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-purple-700">{t('invoices.ccCode')}</Label>
                <Input
                  value={ccSearchTerm}
                  readOnly
                  className="bg-gray-50 border-gray-200"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-purple-700">{t('invoices.ccDescription')}</Label>
                <Textarea
                  value={ccDescription}
                  onChange={(e) => setCcDescription(e.target.value)}
                  placeholder={t('invoices.ccDescription')}
                  className="min-h-[100px] resize-none"
                />
              </div>
              <Button
                type="button"
                onClick={handleCcSave}
                disabled={!ccDescription.trim()}
                className="w-full bg-purple-100 text-purple-700 hover:bg-purple-200 disabled:opacity-40"
              >
                {t('common.save')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCcCancel}
                className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                {t('common.cancel')}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ============ Supplier Popup ============ */}
      <Dialog open={showSupplierPopup} onOpenChange={(open) => { setShowSupplierPopup(open); if (!open) setSupplierSearchTerm(''); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-bold">
              {t('invoices.registerSupplier')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={supplierSearchTerm}
                onChange={(e) => setSupplierSearchTerm(e.target.value)}
                placeholder={t('common.supplier')}
                className="flex-1 border-purple-300 focus:border-purple-500"
              />
              <Button
                type="button"
                onClick={handleAddSupplier}
                size="icon"
                disabled={!supplierSearchTerm.trim() || supplierExistsExact}
                className="bg-purple-600 hover:bg-purple-700 rounded-full w-10 h-10 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredSuppliers.length > 0 ? (
                filteredSuppliers.map(s => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white cursor-pointer hover:border-purple-300 hover:bg-purple-50/50 transition-colors"
                    onClick={() => handleSupplierClickItem(s.id)}
                  >
                    <span className="text-sm font-medium text-gray-800">{s.name}</span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); deleteSupplier(s.id); }}
                      className="text-purple-600 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-400">
                  <p className="text-sm">{t('invoices.noResults')}</p>
                  <p className="text-xs">{t('invoices.createSupplier')}</p>
                </div>
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => setShowSupplierPopup(false)}
              className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              {t('invoices.goBack')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
