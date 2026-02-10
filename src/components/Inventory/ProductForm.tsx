
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useData } from '@/contexts/DataContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface ProductFormProps {
  productId?: string | null;
  onClose: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ productId, onClose }) => {
  const { t } = useLanguage();
  const {
    products,
    categories,
    suppliers,
    addProduct,
    updateProduct,
    addInventoryItem,
    stores,
    getProductById
  } = useData();

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    supplierId: '',
    categoryId: '',
    costPrice: 0,
    sellingPrice: 0,
    barcode: '',
    unit: 'UN.',
    imageUrl: '',
    initialStock: 0,
    minStock: 10,
    storeId: ''
  });

  const isEdit = !!productId;
  const existingProduct = productId ? getProductById(productId) : null;

  useEffect(() => {
    if (existingProduct) {
      setFormData({
        name: existingProduct.name,
        sku: existingProduct.sku,
        supplierId: existingProduct.supplierId,
        categoryId: existingProduct.categoryId,
        costPrice: existingProduct.costPrice,
        sellingPrice: existingProduct.sellingPrice,
        barcode: existingProduct.barcode,
        unit: existingProduct.unit || 'UN.',
        imageUrl: existingProduct.imageUrl || '',
        initialStock: 0,
        minStock: 10,
        storeId: ''
      });
    }
  }, [existingProduct]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.sku || !formData.supplierId || !formData.categoryId) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      if (isEdit && productId) {
        updateProduct(productId, {
          name: formData.name,
          sku: formData.sku,
          supplierId: formData.supplierId,
          categoryId: formData.categoryId,
          costPrice: formData.costPrice,
          sellingPrice: formData.sellingPrice,
          barcode: formData.barcode,
          unit: formData.unit,
          imageUrl: formData.imageUrl || undefined
        });
        toast.success('Produto atualizado com sucesso!');
      } else {
        const newProduct = {
          name: formData.name,
          sku: formData.sku,
          supplierId: formData.supplierId,
          categoryId: formData.categoryId,
          costPrice: formData.costPrice,
          sellingPrice: formData.sellingPrice,
          barcode: formData.barcode,
          unit: formData.unit,
          imageUrl: formData.imageUrl || undefined
        };

        addProduct(newProduct);

        // Add initial inventory if specified
        if (formData.initialStock > 0 && formData.storeId) {
          addInventoryItem({
            storeId: formData.storeId,
            productId: 'temp', // This will be replaced with actual ID
            currentQuantity: formData.initialStock,
            minQuantity: formData.minStock,
            lastUpdated: new Date()
          });
        }

        toast.success('Produto criado com sucesso!');
      }

      onClose();
    } catch (error) {
      toast.error('Erro ao salvar produto');
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Editar Produto' : 'Adicionar Produto'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Produto *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Digite o nome do produto"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sku">SKU *</Label>
            <Input
              id="sku"
              value={formData.sku}
              onChange={(e) => handleInputChange('sku', e.target.value)}
              placeholder="Digite o SKU"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria *</Label>
            <Select value={formData.categoryId} onValueChange={(value) => handleInputChange('categoryId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier">Fornecedor *</Label>
            <Select value={formData.supplierId} onValueChange={(value) => handleInputChange('supplierId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o fornecedor" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="costPrice">Preço de Custo</Label>
              <Input
                id="costPrice"
                type="number"
                step="0.01"
                value={formData.costPrice}
                onChange={(e) => handleInputChange('costPrice', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sellingPrice">Preço de Venda</Label>
              <Input
                id="sellingPrice"
                type="number"
                step="0.01"
                value={formData.sellingPrice}
                onChange={(e) => handleInputChange('sellingPrice', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="barcode">Código de Barras</Label>
            <Input
              id="barcode"
              value={formData.barcode}
              onChange={(e) => handleInputChange('barcode', e.target.value)}
              placeholder="Digite o código de barras"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit">Unidade *</Label>
              <Select value={formData.unit} onValueChange={(value) => handleInputChange('unit', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a unidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UN.">UN. (Unidade)</SelectItem>
                  <SelectItem value="KG">KG (Quilograma)</SelectItem>
                  <SelectItem value="L">L (Litro)</SelectItem>
                  <SelectItem value="ML">ML (Mililitro)</SelectItem>
                  <SelectItem value="CX">CX (Caixa)</SelectItem>
                  <SelectItem value="PCT">PCT (Pacote)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">URL da Imagem</Label>
              <Input
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          {!isEdit && (
            <>
              <div className="space-y-2">
                <Label htmlFor="store">Loja para Estoque Inicial</Label>
                <Select value={formData.storeId} onValueChange={(value) => handleInputChange('storeId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a loja" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="initialStock">Estoque Inicial</Label>
                  <Input
                    id="initialStock"
                    type="number"
                    value={formData.initialStock}
                    onChange={(e) => handleInputChange('initialStock', parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minStock">Estoque Mínimo</Label>
                  <Input
                    id="minStock"
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => handleInputChange('minStock', parseInt(e.target.value) || 0)}
                    placeholder="10"
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {t('common.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductForm;
