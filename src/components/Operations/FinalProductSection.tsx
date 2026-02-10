
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useData } from '@/contexts/DataContext';

interface FinalProductSectionProps {
  recipe: any;
  actualYield: number;
  onYieldChange: (yieldValue: number) => void;
}

const FinalProductSection: React.FC<FinalProductSectionProps> = ({
  recipe,
  actualYield,
  onYieldChange
}) => {
  const { getProductById } = useData();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Produto Final</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <h4 className="font-medium">{getProductById(recipe.finalProductId)?.name}</h4>
            <p className="text-sm text-gray-500">Rendimento esperado: {recipe.expectedYield} {recipe.yieldUnit}</p>
          </div>
          <div className="flex items-center gap-2">
            <Label>Rendimento real:</Label>
            <Input
              type="number"
              value={actualYield}
              onChange={(e) => onYieldChange(parseFloat(e.target.value) || 0)}
              className="w-32"
              min="0"
              step="0.01"
            />
            <span className="text-sm text-gray-500">{recipe.yieldUnit}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinalProductSection;
