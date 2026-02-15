
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Package, AlertTriangle } from 'lucide-react';
import { useData } from '@/contexts/DataContext';

interface IngredientsListProps {
  actualIngredients: Array<{
    productId: string;
    quantity: number;
    actualQuantity: number;
    unit: string;
    availableStock: number;
  }>;
  onUpdateIngredientQuantity: (index: number, quantity: number) => void;
}

const IngredientsList: React.FC<IngredientsListProps> = ({
  actualIngredients,
  onUpdateIngredientQuantity
}) => {
  const { getProductById } = useData();

  const getStockStatus = (ingredient: any) => {
    if (ingredient.availableStock >= ingredient.actualQuantity) {
      return { status: 'ok', color: 'text-emerald-600', bg: 'bg-emerald-50/50 border-emerald-200' };
    } else {
      return { status: 'insufficient', color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20' };
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Ingredientes Necessários
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {actualIngredients.map((ingredient, index) => {
            const product = getProductById(ingredient.productId);
            const stockStatus = getStockStatus(ingredient);

            return (
              <div key={index} className={`flex items-center gap-4 p-4 border rounded-lg ${stockStatus.bg}`}>
                <div className="flex-1">
                  <h4 className="font-medium">{product?.name || 'Produto não encontrado'}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-muted-foreground">
                      Estoque: {ingredient.availableStock} {ingredient.unit}
                    </span>
                    {stockStatus.status === 'insufficient' && (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label>Quantidade:</Label>
                  <Input
                    type="number"
                    value={ingredient.actualQuantity}
                    onChange={(e) => onUpdateIngredientQuantity(index, parseFloat(e.target.value) || 0)}
                    className="w-24"
                    min="0"
                    step="0.01"
                  />
                  <span className="text-sm text-muted-foreground">{ingredient.unit}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default IngredientsList;
