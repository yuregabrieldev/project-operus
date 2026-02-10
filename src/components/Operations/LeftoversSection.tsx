
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Leaf } from 'lucide-react';
import { useData } from '@/contexts/DataContext';

interface LeftoverItem {
  productId: string;
  quantity: number;
  unit: string;
  destination: string;
}

interface LeftoversSectionProps {
  leftovers: LeftoverItem[];
  onAddLeftover: () => void;
  onRemoveLeftover: (index: number) => void;
  onUpdateLeftover: (index: number, field: keyof LeftoverItem, value: string | number) => void;
}

const LeftoversSection: React.FC<LeftoversSectionProps> = ({
  leftovers,
  onAddLeftover,
  onRemoveLeftover,
  onUpdateLeftover
}) => {
  const { products } = useData();

  const leftoverProducts = products.filter(p => 
    p.categoryId === '5' || 
    p.name.toLowerCase().includes('casca') || 
    p.name.toLowerCase().includes('sobra')
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-green-600" />
            Sobras/Resíduos
          </div>
          <Button onClick={onAddLeftover} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Sobra
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {leftovers.map((leftover, index) => (
            <div key={index} className="flex items-center gap-4 p-4 border rounded-lg bg-green-50">
              <div className="flex-1 grid grid-cols-4 gap-4">
                <div>
                  <Label>Produto</Label>
                  <Select
                    value={leftover.productId}
                    onValueChange={(value) => onUpdateLeftover(index, 'productId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {leftoverProducts.map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Quantidade</Label>
                  <Input
                    type="number"
                    value={leftover.quantity}
                    onChange={(e) => onUpdateLeftover(index, 'quantity', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label>Unidade</Label>
                  <Select
                    value={leftover.unit}
                    onValueChange={(value) => onUpdateLeftover(index, 'unit', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="un">unidade(s)</SelectItem>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="g">g</SelectItem>
                      <SelectItem value="l">litro(s)</SelectItem>
                      <SelectItem value="ml">ml</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Destino</Label>
                  <Select
                    value={leftover.destination}
                    onValueChange={(value) => onUpdateLeftover(index, 'destination', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="descarte">Descarte</SelectItem>
                      <SelectItem value="compostagem">Compostagem</SelectItem>
                      <SelectItem value="ração">Ração Animal</SelectItem>
                      <SelectItem value="reaproveitamento">Reaproveitamento</SelectItem>
                      <SelectItem value="doação">Doação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button 
                onClick={() => onRemoveLeftover(index)} 
                size="sm" 
                variant="ghost"
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
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
  );
};

export default LeftoversSection;
