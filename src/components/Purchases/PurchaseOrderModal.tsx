
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Copy, MessageCircle, Download, Truck, FileText, Package } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';

interface PurchaseItem {
  productId: string;
  productName: string;
  productCode: string;
  currentStock: number;
  minStock: number;
  idealStock: number;
  suggested: number;
  order: number;
  unit: string;
  stores: Array<{
    storeId: string;
    storeName: string;
    currentStock: number;
    minStock: number;
    idealStock: number;
    quantity: number;
  }>;
}

interface PurchaseOrderModalProps {
  isOpen: boolean;
  items: PurchaseItem[];
  onClose: () => void;
}

export const PurchaseOrderModal: React.FC<PurchaseOrderModalProps> = ({
  isOpen,
  items,
  onClose
}) => {
  const { t } = useLanguage();
  const { getProductById, getSupplierById, getStoreById, addMovement, addInvoice } = useData();
  const [showTransitDialog, setShowTransitDialog] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [observation, setObservation] = useState('');
  const [isCreatingTransit, setIsCreatingTransit] = useState(false);

  const formatOrderText = () => {
    if (items.length === 0) return '';

    // Group items by supplier
    const supplierGroups = new Map<string, { supplier: any, items: PurchaseItem[] }>();
    items.forEach(item => {
      const product = getProductById(item.productId);
      if (product) {
        const supplier = getSupplierById(product.supplierId);
        if (supplier) {
          if (!supplierGroups.has(supplier.id)) {
            supplierGroups.set(supplier.id, { supplier, items: [] });
          }
          supplierGroups.get(supplier.id)!.items.push(item);
        }
      }
    });

    let orderText = '';

    supplierGroups.forEach(({ supplier, items: supplierItems }) => {
      orderText += `Pedido de Compra | ${supplier.name.toUpperCase()}\n\n`;

      // GENERAL Section
      orderText += `GERAL:\n`;
      supplierItems.forEach(item => {
        const padding = '_'.repeat(Math.max(1, 40 - item.productName.length));
        orderText += `${item.productName.toUpperCase()} ${padding} QTDE: ${item.order}\n`;
      });

      // PER STORE Section
      const storeGroups = new Map<string, Array<{ productName: string, quantity: number }>>();
      supplierItems.forEach(item => {
        item.stores.forEach(store => {
          if (store.quantity > 0) {
            if (!storeGroups.has(store.storeId)) {
              storeGroups.set(store.storeId, []);
            }
            storeGroups.get(store.storeId)!.push({
              productName: item.productName,
              quantity: store.quantity
            });
          }
        });
      });

      if (storeGroups.size > 0) {
        orderText += `\nPOR LOJA:\n\n`;

        storeGroups.forEach((products, storeId) => {
          const store = getStoreById(storeId);
          if (!store) return;

          orderText += `${store.name.toUpperCase()}\n`;
          products.forEach(product => {
            const padding = '_'.repeat(Math.max(1, 40 - product.productName.length));
            orderText += `${product.productName.toUpperCase()} ${padding}QTDE: ${product.quantity}\n`;
          });
          orderText += `Dados da Loja:\n`;
          orderText += `${store.address}\n`;
          orderText += `Responsável: ${store.contact}\n\n`;
        });
      }

      orderText += `-------------------\n\n`;
    });

    return orderText.trim();
  };

  const copyToClipboard = async () => {
    const text = formatOrderText();
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: t('purchases.copied'),
        description: t('purchases.copiedDescription'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('purchases.copyError'),
        variant: "destructive"
      });
    }
  };

  const sendWhatsApp = () => {
    const text = formatOrderText();
    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://wa.me/?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleOpenTransitDialog = () => {
    setShowTransitDialog(true);
  };

  const handleCreateTransit = async () => {
    if (!orderNumber.trim() || !observation.trim()) {
      toast({
        title: t('purchases.requiredFields'),
        description: t('purchases.fillRequiredFields'),
        variant: "destructive"
      });
      return;
    }

    setIsCreatingTransit(true);

    try {
      // Create transit movements for each product-store combination
      let transitCount = 0;
      items.forEach(item => {
        item.stores.forEach(store => {
          if (store.quantity > 0) {
            addMovement({
              productId: item.productId,
              toStoreId: store.storeId,
              quantity: store.quantity,
              status: 'in_transit',
              createdAt: new Date(),
              userId: 'user1',
              type: 'in'
            });
            transitCount++;
          }
        });
      });

      // Create an invoice for the order
      const product0 = items[0] ? getProductById(items[0].productId) : null;
      const supplier = product0 ? getSupplierById(product0.supplierId) : null;
      const totalAmount = items.reduce((sum, item) => {
        const p = getProductById(item.productId);
        return sum + (p ? p.costPrice * item.order : 0);
      }, 0);

      addInvoice({
        supplierId: supplier?.id || '',
        invoiceNumber: orderNumber,
        amount: totalAmount,
        status: 'pending',
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      toast({
        title: t('purchases.transitCreated'),
        description: t('purchases.transitCreatedDescription').replace('{count}', String(transitCount)),
      });

      setShowTransitDialog(false);
      setOrderNumber('');
      setObservation('');
      onClose();
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('purchases.transitError'),
        variant: "destructive"
      });
    } finally {
      setIsCreatingTransit(false);
    }
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.order, 0);
  };

  const getTotalStores = () => {
    const storeIds = new Set<string>();
    items.forEach(item => {
      item.stores.forEach(store => {
        if (store.quantity > 0) storeIds.add(store.storeId);
      });
    });
    return storeIds.size;
  };

  const getTransitItemCount = () => {
    let count = 0;
    items.forEach(item => {
      item.stores.forEach(store => {
        if (store.quantity > 0) count++;
      });
    });
    return count;
  };

  const getSupplierCount = () => {
    const supplierIds = new Set<string>();
    items.forEach(item => {
      const product = getProductById(item.productId);
      if (product) supplierIds.add(product.supplierId);
    });
    return supplierIds.size;
  };

  return (
    <>
      <Dialog open={isOpen && !showTransitDialog} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <span>{t('purchases.orderSummary')}</span>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">{items.length} {t('purchases.products')}</Badge>
                <Badge variant="outline">{getTotalItems()} {t('purchases.units')}</Badge>
                <Badge variant="outline">{getTotalStores()} {t('purchases.storesLabel')}</Badge>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{getSupplierCount()}</div>
                <div className="text-sm text-blue-600">{t('purchases.suppliers')}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{getTotalStores()}</div>
                <div className="text-sm text-green-600">{t('purchases.storesServed')}</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">{getTotalItems()}</div>
                <div className="text-sm text-purple-600">{t('purchases.totalItems')}</div>
              </div>
            </div>

            {/* Formatted Order Text */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-3">{t('purchases.formattedOrder')}:</h3>
              <pre className="whitespace-pre-wrap text-sm bg-white p-4 rounded border max-h-96 overflow-y-auto font-mono">
                {formatOrderText()}
              </pre>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={copyToClipboard}
                className="flex-1 min-w-0"
              >
                <Copy className="h-4 w-4 mr-2" />
                {t('purchases.copyText')}
              </Button>

              <Button
                variant="outline"
                onClick={sendWhatsApp}
                className="flex-1 min-w-0 text-green-600 border-green-600 hover:bg-green-50"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>

              <Button
                onClick={handleOpenTransitDialog}
                className="flex-1 min-w-0 bg-purple-700 hover:bg-purple-800"
              >
                <Truck className="h-4 w-4 mr-2" />
                {t('purchases.createTransit')}
              </Button>
            </div>

            {/* Close Button */}
            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={onClose}>
                {t('common.close')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transit Creation Sub-Dialog */}
      <Dialog open={showTransitDialog} onOpenChange={setShowTransitDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('purchases.transitCreation')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {t('purchases.transitWillCreate').replace('{count}', String(getTransitItemCount()))}
            </p>

            <div className="space-y-1.5">
              <Label className="font-medium">{t('purchases.orderNumberLabel')}*</Label>
              <Input
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder={t('purchases.orderNumberPlaceholder')}
                className="border-gray-300"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="font-medium">{t('purchases.observationLabel')}*</Label>
              <Textarea
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                placeholder={t('purchases.observationPlaceholder')}
                className="border-gray-300 min-h-[100px]"
              />
            </div>

            <p className="text-xs text-gray-400">
              {t('purchases.transitNote')}
            </p>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowTransitDialog(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleCreateTransit}
                disabled={isCreatingTransit || !orderNumber.trim() || !observation.trim()}
                className="flex-1 bg-purple-700 hover:bg-purple-800"
              >
                {isCreatingTransit ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                    {t('purchases.creating')}
                  </>
                ) : (
                  <>
                    <Truck className="h-4 w-4 mr-2" />
                    {t('purchases.createTransitAndInvoice')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
