
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, MessageCircle, Download, Truck, Check } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
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
  const { getProductById, getSupplierById } = useData();
  const [isCreatingTransit, setIsCreatingTransit] = useState(false);

  const formatOrderText = () => {
    if (items.length === 0) return '';

    const supplierIds = new Set<string>();
    items.forEach(item => {
      const product = getProductById(item.productId);
      if (product) supplierIds.add(product.supplierId);
    });

    let orderText = '';
    
    supplierIds.forEach(supplierId => {
      const supplier = getSupplierById(supplierId);
      if (!supplier) return;

      const supplierItems = items.filter(item => {
        const product = getProductById(item.productId);
        return product?.supplierId === supplierId;
      });

      if (supplierItems.length === 0) return;

      orderText += `FORNECEDOR: ${supplier.name.toUpperCase()}\n`;
      orderText += `DATA: ${new Date().toLocaleDateString('pt-BR')}\n`;
      orderText += `-------------------\n\n`;

      // Agrupar por loja
      const storeGroups = new Map<string, Array<{productName: string, productCode: string, quantity: number}>>();
      
      supplierItems.forEach(item => {
        item.stores.forEach(store => {
          if (store.quantity > 0) {
            if (!storeGroups.has(store.storeName)) {
              storeGroups.set(store.storeName, []);
            }
            storeGroups.get(store.storeName)!.push({
              productName: item.productName,
              productCode: item.productCode,
              quantity: store.quantity
            });
          }
        });
      });

      storeGroups.forEach((products, storeName) => {
        orderText += `${storeName.toUpperCase()}:\n`;
        products.forEach(product => {
          orderText += `- ${product.productName} (${product.productCode}): ${product.quantity}un\n`;
        });
        orderText += '\n';
      });

      orderText += '-------------------\n\n';
    });

    return orderText.trim();
  };

  const copyToClipboard = async () => {
    const text = formatOrderText();
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copiado!",
        description: "Pedido copiado para a área de transferência",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o pedido",
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

  const downloadAsImage = async () => {
    // Esta funcionalidade seria implementada com html2canvas ou similar
    toast({
      title: "Em desenvolvimento",
      description: "Funcionalidade de download como imagem em breve",
    });
  };

  const createTransit = async () => {
    setIsCreatingTransit(true);
    
    // Simular criação do trânsito
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: "Trânsito Criado!",
      description: `${items.length} produtos foram adicionados ao sistema de trânsito`,
    });
    
    setIsCreatingTransit(false);
    onClose();
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

  const getSupplierCount = () => {
    const supplierIds = new Set<string>();
    items.forEach(item => {
      const product = getProductById(item.productId);
      if (product) supplierIds.add(product.supplierId);
    });
    return supplierIds.size;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Resumo do Pedido</span>
            <div className="flex gap-2">
              <Badge variant="outline">
                {items.length} produtos
              </Badge>
              <Badge variant="outline">
                {getTotalItems()} unidades
              </Badge>
              <Badge variant="outline">
                {getTotalStores()} lojas
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo Estatístico */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{getSupplierCount()}</div>
              <div className="text-sm text-blue-600">Fornecedores</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{getTotalStores()}</div>
              <div className="text-sm text-green-600">Lojas Atendidas</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">{getTotalItems()}</div>
              <div className="text-sm text-purple-600">Total de Itens</div>
            </div>
          </div>

          {/* Visualização do Pedido */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Pedido Formatado:</h3>
            <pre className="whitespace-pre-wrap text-sm bg-white p-4 rounded border max-h-96 overflow-y-auto font-mono">
              {formatOrderText()}
            </pre>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-wrap gap-3 pt-4 border-t">
            <Button
              variant="outline" 
              onClick={copyToClipboard}
              className="flex-1 min-w-0"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar Texto
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
              variant="outline"
              onClick={downloadAsImage}
              className="flex-1 min-w-0"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            
            <Button
              onClick={createTransit}
              disabled={isCreatingTransit}
              className="flex-1 min-w-0 bg-orange-600 hover:bg-orange-700"
            >
              {isCreatingTransit ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                  Criando...
                </>
              ) : (
                <>
                  <Truck className="h-4 w-4 mr-2" />
                  Criar Trânsito
                </>
              )}
            </Button>
          </div>

          {/* Botão Fechar */}
          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
