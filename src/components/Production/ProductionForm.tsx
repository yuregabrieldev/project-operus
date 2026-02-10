import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { toast } from '@/hooks/use-toast';

interface ProductionFormProps {
  recipe: any;
  onClose: () => void;
}

const ProductionForm: React.FC<ProductionFormProps> = ({ recipe, onClose }) => {
  const { 
    products,
    inventory,
    getProductById,
    addProductionRecord,
    updateInventoryItem,
    addOperationLog
  } = useData();

  const [actualIngredients, setActualIngredients] = useState(
    recipe.ingredients.map((ing: any) => ({ ...ing, actualQuantity: ing.quantity }))
  );
  const [actualYield, setActualYield] = useState(recipe.expectedYield);
  const [leftovers, setLeftovers] = useState<Array<{
    productId: string;
    quantity: number;
    destination: string;
  }>>([]);
  const [notes, setNotes] = useState('');

  const addLeftover = () => {
    setLeftovers([...leftovers, { productId: '', quantity: 0, destination: 'descarte' }]);
  };

  const removeLeftover = (index: number) => {
    setLeftovers(leftovers.filter((_, i) => i !== index));
  };

  const updateLeftover = (index: number, field: string, value: any) => {
    const updated = [...leftovers];
    updated[index] = { ...updated[index], [field]: value };
    setLeftovers(updated);
  };

  const validateProduction = () => {
    // Verificar se há estoque suficiente
    for (const ingredient of actualIngredients) {
      const inventoryItem = inventory.find(item => item.productId === ingredient.productId);
      if (!inventoryItem || inventoryItem.currentQuantity < ingredient.actualQuantity) {
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateProduction()) {
      toast({
        title: "Estoque Insuficiente",
        description: "Não há estoque suficiente para os ingredientes especificados.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Criar registro de produção
      const productionRecord = {
        recipeId: recipe.id,
        storeId: '1', // TODO: Obter loja atual
        userId: 'current-user', // TODO: Obter usuário atual
        actualYield,
        ingredientsUsed: actualIngredients.map(ing => ({
          productId: ing.productId,
          quantity: ing.actualQuantity
        })),
        leftovers: leftovers.filter(l => l.productId && l.quantity > 0),
        notes,
        createdAt: new Date()
      };

      // Atualizar estoque - debitar ingredientes
      for (const ingredient of actualIngredients) {
        const inventoryItem = inventory.find(item => item.productId === ingredient.productId);
        if (inventoryItem) {
          updateInventoryItem(inventoryItem.id, {
            currentQuantity: inventoryItem.currentQuantity - ingredient.actualQuantity
          });

          // Log da operação
          addOperationLog({
            productId: ingredient.productId,
            storeId: '1',
            userId: 'current-user',
            quantity: ingredient.actualQuantity,
            actionType: 'withdrawal',
            notes: `Produção: ${recipe.name}`,
            createdAt: new Date()
          });
        }
      }

      // Atualizar estoque - creditar produto final
      const finalProductInventory = inventory.find(item => item.productId === recipe.finalProductId);
      if (finalProductInventory) {
        updateInventoryItem(finalProductInventory.id, {
          currentQuantity: finalProductInventory.currentQuantity + actualYield
        });

        // Log da operação
        addOperationLog({
          productId: recipe.finalProductId,
          storeId: '1',
          userId: 'current-user',
          quantity: actualYield,
          actionType: 'entry',
          notes: `Produção: ${recipe.name}`,
          createdAt: new Date()
        });
      }

      // Registrar sobras se houver
      for (const leftover of leftovers.filter(l => l.productId && l.quantity > 0)) {
        const leftoverInventory = inventory.find(item => item.productId === leftover.productId);
        if (leftoverInventory) {
          updateInventoryItem(leftoverInventory.id, {
            currentQuantity: leftoverInventory.currentQuantity + leftover.quantity
          });

          // Log da operação
          addOperationLog({
            productId: leftover.productId,
            storeId: '1',
            userId: 'current-user',
            quantity: leftover.quantity,
            actionType: 'entry',
            notes: `Sobra de produção: ${recipe.name} - ${leftover.destination}`,
            createdAt: new Date()
          });
        }
      }

      addProductionRecord(productionRecord);

      toast({
        title: "Produção Registrada",
        description: `Produção de ${recipe.name} registrada com sucesso!`
      });

      onClose();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao registrar produção.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Ingredientes */}
      <Card>
        <CardHeader>
          <CardTitle>Ingredientes Necessários</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {actualIngredients.map((ingredient, index) => {
              const product = getProductById(ingredient.productId);
              const inventoryItem = inventory.find(item => item.productId === ingredient.productId);
              const hasStock = inventoryItem && inventoryItem.currentQuantity >= ingredient.actualQuantity;

              return (
                <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{product?.name}</h4>
                    <p className="text-sm text-gray-500">
                      Estoque: {inventoryItem?.currentQuantity || 0} unidades
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label>Quantidade:</Label>
                    <Input
                      type="number"
                      value={ingredient.actualQuantity}
                      onChange={(e) => {
                        const updated = [...actualIngredients];
                        updated[index].actualQuantity = parseFloat(e.target.value) || 0;
                        setActualIngredients(updated);
                      }}
                      className="w-24"
                      min="0"
                    />
                    {!hasStock && (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Produto Final */}
      <Card>
        <CardHeader>
          <CardTitle>Produto Final</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <h4 className="font-medium">{getProductById(recipe.finalProductId)?.name}</h4>
                <p className="text-sm text-gray-500">Rendimento esperado: {recipe.expectedYield}ml</p>
              </div>
              <div className="flex items-center gap-2">
                <Label>Rendimento real (ml):</Label>
                <Input
                  type="number"
                  value={actualYield}
                  onChange={(e) => setActualYield(parseFloat(e.target.value) || 0)}
                  className="w-32"
                  min="0"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sobras */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Sobras/Resíduos
            <Button onClick={addLeftover} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Sobra
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leftovers.map((leftover, index) => (
              <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex-1 grid grid-cols-3 gap-4">
                  <div>
                    <Label>Produto</Label>
                    <select
                      value={leftover.productId}
                      onChange={(e) => updateLeftover(index, 'productId', e.target.value)}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="">Selecione...</option>
                      {products.filter(p => p.categoryId === '5').map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Quantidade</Label>
                    <Input
                      type="number"
                      value={leftover.quantity}
                      onChange={(e) => updateLeftover(index, 'quantity', parseFloat(e.target.value) || 0)}
                      min="0"
                    />
                  </div>
                  <div>
                    <Label>Destino</Label>
                    <select
                      value={leftover.destination}
                      onChange={(e) => updateLeftover(index, 'destination', e.target.value)}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="descarte">Descarte</option>
                      <option value="reaproveitamento">Reaproveitamento</option>
                      <option value="compostagem">Compostagem</option>
                    </select>
                  </div>
                </div>
                <Button 
                  onClick={() => removeLeftover(index)} 
                  size="sm" 
                  variant="ghost"
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {leftovers.length === 0 && (
              <p className="text-gray-500 text-center py-4">Nenhuma sobra adicionada</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Observações */}
      <Card>
        <CardHeader>
          <CardTitle>Observações</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observações sobre a produção..."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex justify-end gap-2">
        <Button onClick={onClose} variant="outline">
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={!validateProduction()}>
          Registrar Produção
        </Button>
      </div>
    </div>
  );
};

export default ProductionForm;