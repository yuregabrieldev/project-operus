import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { toast } from '@/hooks/use-toast';
import ProductionHeader from './ProductionHeader';
import IngredientsList from './IngredientsList';
import FinalProductSection from './FinalProductSection';
import LeftoversSection from './LeftoversSection';
import ProductionNotes from './ProductionNotes';
import ProductionActions from './ProductionActions';

interface LeftoverItem {
  productId: string;
  quantity: number;
  unit: string;
  destination: string;
}

interface ProductionExecutionFormProps {
  recipe: any;
  onClose: () => void;
}

const ProductionExecutionForm: React.FC<ProductionExecutionFormProps> = ({ recipe, onClose }) => {
  const { 
    inventory,
    addOperationLog,
    updateInventoryItem
  } = useData();

  const [actualIngredients, setActualIngredients] = useState(
    recipe.ingredients.map((ing: any) => ({ 
      ...ing, 
      actualQuantity: ing.quantity,
      availableStock: inventory.find(item => item.productId === ing.productId)?.currentQuantity || 0
    }))
  );
  const [actualYield, setActualYield] = useState(recipe.expectedYield);
  const [leftovers, setLeftovers] = useState<LeftoverItem[]>([]);
  const [notes, setNotes] = useState('');

  const addLeftover = () => {
    setLeftovers([...leftovers, { productId: '', quantity: 0, unit: 'un', destination: 'descarte' }]);
  };

  const removeLeftover = (index: number) => {
    setLeftovers(leftovers.filter((_, i) => i !== index));
  };

  const updateLeftover = (index: number, field: keyof LeftoverItem, value: string | number) => {
    const updated = [...leftovers];
    updated[index] = { ...updated[index], [field]: value };
    setLeftovers(updated);
  };

  const updateIngredientQuantity = (index: number, quantity: number) => {
    const updated = [...actualIngredients];
    updated[index].actualQuantity = quantity;
    setActualIngredients(updated);
  };

  const canExecuteProduction = () => {
    return actualIngredients.every(ing => ing.availableStock >= ing.actualQuantity);
  };

  const handleSubmit = async () => {
    if (!canExecuteProduction()) {
      toast({
        title: "Estoque Insuficiente",
        description: "Verifique o estoque dos ingredientes antes de continuar.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Debitar ingredientes do estoque
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

      // Creditar produto final
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

      // Registrar sobras
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

      toast({
        title: "Produção Registrada",
        description: `Produção de ${recipe.name} concluída com sucesso!`
      });

      onClose();
    } catch (error) {
      console.error('Erro ao registrar produção:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar produção.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <ProductionHeader recipe={recipe} />
      
      <IngredientsList 
        actualIngredients={actualIngredients}
        onUpdateIngredientQuantity={updateIngredientQuantity}
      />
      
      <FinalProductSection 
        recipe={recipe}
        actualYield={actualYield}
        onYieldChange={setActualYield}
      />
      
      <LeftoversSection 
        leftovers={leftovers}
        onAddLeftover={addLeftover}
        onRemoveLeftover={removeLeftover}
        onUpdateLeftover={updateLeftover}
      />
      
      <ProductionNotes 
        notes={notes}
        onNotesChange={setNotes}
      />
      
      <ProductionActions 
        canExecuteProduction={canExecuteProduction()}
        onCancel={onClose}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default ProductionExecutionForm;
