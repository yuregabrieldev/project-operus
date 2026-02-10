
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import { useData } from '@/contexts/DataContext';

interface ProductionHeaderProps {
  recipe: any;
}

const ProductionHeader: React.FC<ProductionHeaderProps> = ({ recipe }) => {
  const { getProductById } = useData();

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader>
        <CardTitle className="text-blue-800">Executando: {recipe.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="bg-white">
            Rendimento esperado: {recipe.expectedYield} {recipe.yieldUnit}
          </Badge>
          <ArrowRight className="h-4 w-4 text-blue-600" />
          <Badge className="bg-blue-600 text-white">
            {getProductById(recipe.finalProductId)?.name}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductionHeader;
