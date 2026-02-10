
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Package, ArrowRight } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { toast } from '@/hooks/use-toast';

interface ProductionRecipeFormProps {
  onClose: () => void;
}

const ProductionRecipeForm: React.FC<ProductionRecipeFormProps> = ({ onClose }) => {
  const { products, addRecipe } = useData();
  
  const [recipeName, setRecipeName] = useState('');
  const [finalProductId, setFinalProductId] = useState('');
  const [expectedYield, setExpectedYield] = useState(0);
  const [yieldUnit, setYieldUnit] = useState('ml');
  const [ingredients, setIngredients] = useState<Array<{
    productId: string;
    quantity: number;
    unit: string;
  }>>([
    { productId: '', quantity: 0, unit: 'un' }
  ]);

  // Filtrar produtos por tipo
  const insumos = products.filter(p => p.categoryId === '1' || p.categoryId === '2'); // Frutas e Vegetais
  const produtosFinals = products.filter(p => p.categoryId === '4'); // Produtos Finais

  const addIngredient = () => {
    setIngredients([...ingredients, { productId: '', quantity: 0, unit: 'un' }]);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const updateIngredient = (index: number, field: string, value: any) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const handleSubmit = () => {
    if (!recipeName || !finalProductId || expectedYield <= 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const validIngredients = ingredients.filter(ing => ing.productId && ing.quantity > 0);
    if (validIngredients.length === 0) {
      toast({
        title: "Ingredientes necessários",
        description: "Adicione pelo menos um ingrediente.",
        variant: "destructive"
      });
      return;
    }

    const newRecipe = {
      id: `recipe-${Date.now()}`,
      name: recipeName,
      finalProductId,
      ingredients: validIngredients,
      expectedYield,
      yieldUnit,
      createdAt: new Date(),
      isActive: true
    };

    addRecipe(newRecipe);

    toast({
      title: "Fórmula criada",
      description: `Fórmula "${recipeName}" criada com sucesso!`
    });

    onClose();
  };

  return (
    <div className="space-y-6">
      {/* Informações da Fórmula */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Informações da Fórmula
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="recipeName">Nome da Fórmula *</Label>
            <Input
              id="recipeName"
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
              placeholder="Ex: Suco de Abacaxi Premium"
            />
          </div>

          <div>
            <Label htmlFor="finalProduct">Produto Final *</Label>
            <Select value={finalProductId} onValueChange={setFinalProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o produto final..." />
              </SelectTrigger>
              <SelectContent>
                {produtosFinals.map(product => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} - {product.sku}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="yield">Rendimento Esperado *</Label>
              <Input
                id="yield"
                type="number"
                value={expectedYield}
                onChange={(e) => setExpectedYield(parseFloat(e.target.value) || 0)}
                placeholder="Ex: 300"
                min="0"
              />
            </div>
            <div>
              <Label htmlFor="yieldUnit">Unidade</Label>
              <Select value={yieldUnit} onValueChange={setYieldUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ml">ml</SelectItem>
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="un">unidade(s)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ingredientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Ingredientes Necessários</span>
            <Button onClick={addIngredient} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ingredients.map((ingredient, index) => (
              <div key={index} className="flex items-center gap-4 p-4 border rounded-lg bg-gray-50">
                <div className="flex-1 grid grid-cols-3 gap-4">
                  <div>
                    <Label>Insumo</Label>
                    <Select
                      value={ingredient.productId}
                      onValueChange={(value) => updateIngredient(index, 'productId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {insumos.map(product => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} - {product.sku}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Quantidade</Label>
                    <Input
                      type="number"
                      value={ingredient.quantity}
                      onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value) || 0)}
                      placeholder="Ex: 2"
                      min="0"
                    />
                  </div>
                  <div>
                    <Label>Unidade</Label>
                    <Select
                      value={ingredient.unit}
                      onValueChange={(value) => updateIngredient(index, 'unit', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="un">unidade(s)</SelectItem>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="g">g</SelectItem>
                        <SelectItem value="ml">ml</SelectItem>
                        <SelectItem value="l">litro(s)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {ingredients.length > 1 && (
                  <Button 
                    onClick={() => removeIngredient(index)} 
                    size="sm" 
                    variant="ghost"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preview da Fórmula */}
      {recipeName && finalProductId && ingredients.some(i => i.productId) && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">Preview da Fórmula</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                {ingredients.filter(i => i.productId).map((ing, idx) => {
                  const product = insumos.find(p => p.id === ing.productId);
                  return product ? (
                    <Badge key={idx} variant="outline" className="bg-white">
                      {ing.quantity} {ing.unit} {product.name}
                    </Badge>
                  ) : null;
                })}
              </div>
              <ArrowRight className="h-4 w-4 text-blue-600" />
              <Badge className="bg-blue-600 text-white">
                {expectedYield} {yieldUnit} {produtosFinals.find(p => p.id === finalProductId)?.name}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ações */}
      <div className="flex justify-end gap-2">
        <Button onClick={onClose} variant="outline">
          Cancelar
        </Button>
        <Button onClick={handleSubmit}>
          Criar Fórmula
        </Button>
      </div>
    </div>
  );
};

export default ProductionRecipeForm;
