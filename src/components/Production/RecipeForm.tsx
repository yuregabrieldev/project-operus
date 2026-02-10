import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { toast } from '@/hooks/use-toast';

interface RecipeFormProps {
  onClose: () => void;
}

const RecipeForm: React.FC<RecipeFormProps> = ({ onClose }) => {
  const { products, addRecipe } = useData();
  
  const [name, setName] = useState('');
  const [finalProductId, setFinalProductId] = useState('');
  const [expectedYield, setExpectedYield] = useState(0);
  const [ingredients, setIngredients] = useState<Array<{ productId: string; quantity: number }>>([
    { productId: '', quantity: 0 }
  ]);

  const addIngredient = () => {
    setIngredients([...ingredients, { productId: '', quantity: 0 }]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: string, value: any) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const handleSubmit = () => {
    if (!name || !finalProductId || expectedYield <= 0) {
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
      name,
      finalProductId,
      ingredients: validIngredients,
      expectedYield,
      createdAt: new Date(),
      isActive: true
    };

    addRecipe(newRecipe);

    toast({
      title: "Receita criada",
      description: `Receita "${name}" criada com sucesso!`
    });

    onClose();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações da Receita</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome da Receita *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Suco de Abacaxi"
              />
            </div>

            <div>
              <Label htmlFor="finalProduct">Produto Final *</Label>
              <select
                id="finalProduct"
                value={finalProductId}
                onChange={(e) => setFinalProductId(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Selecione o produto final...</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} - {product.sku}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="yield">Rendimento Esperado (ml) *</Label>
              <Input
                id="yield"
                type="number"
                value={expectedYield}
                onChange={(e) => setExpectedYield(parseFloat(e.target.value) || 0)}
                placeholder="Ex: 300"
                min="0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Ingredientes
            <Button onClick={addIngredient} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ingredients.map((ingredient, index) => (
              <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div>
                    <Label>Produto</Label>
                    <select
                      value={ingredient.productId}
                      onChange={(e) => updateIngredient(index, 'productId', e.target.value)}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="">Selecione o ingrediente...</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name} - {product.sku}
                        </option>
                      ))}
                    </select>
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
                </div>
                {ingredients.length > 1 && (
                  <Button 
                    onClick={() => removeIngredient(index)} 
                    size="sm" 
                    variant="ghost"
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button onClick={onClose} variant="outline">
          Cancelar
        </Button>
        <Button onClick={handleSubmit}>
          Criar Receita
        </Button>
      </div>
    </div>
  );
};

export default RecipeForm;