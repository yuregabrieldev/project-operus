import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/ui/stats-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Factory, Plus, Play, History, AlertTriangle, CheckCircle } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';
import ProductionForm from './ProductionForm';
import RecipeForm from './RecipeForm';

const ProductionManager: React.FC = () => {
  const { t } = useLanguage();
  const {
    recipes,
    productionRecords,
    products,
    inventory,
    getProductById,
    getProductionRecordsByRecipe,
    addProductionRecord,
    updateInventoryItem
  } = useData();

  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [showProductionForm, setShowProductionForm] = useState(false);
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Verificar se uma receita pode ser produzida
  const canProduce = (recipe: any) => {
    return recipe.ingredients.every((ingredient: any) => {
      const inventoryItem = inventory.find(item => item.productId === ingredient.productId);
      return inventoryItem && inventoryItem.currentQuantity >= ingredient.quantity;
    });
  };

  // Estatísticas de produção
  const productionStats = useMemo(() => {
    const today = new Date();
    const todayRecords = productionRecords.filter(record =>
      record.createdAt.toDateString() === today.toDateString()
    );

    return {
      totalRecipes: recipes.filter(r => r.isActive).length,
      todayProductions: todayRecords.length,
      availableRecipes: recipes.filter(r => r.isActive && canProduce(r)).length,
      blockedRecipes: recipes.filter(r => r.isActive && !canProduce(r)).length
    };
  }, [recipes, productionRecords, inventory]);

  const handleStartProduction = (recipe: any) => {
    if (!canProduce(recipe)) {
      toast({
        title: "Estoque Insuficiente",
        description: "Não há estoque suficiente para produzir esta receita.",
        variant: "destructive"
      });
      return;
    }

    setSelectedRecipe(recipe);
    setShowProductionForm(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Produção</h1>
          <p className="text-gray-600">Controle de insumos → produtos finais + sobras</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowHistory(!showHistory)}
            variant="outline"
          >
            <History className="h-4 w-4 mr-2" />
            Histórico
          </Button>
          <Button
            onClick={() => setShowRecipeForm(true)}
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Receita
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatsCard
          title={t('production.totalRecipes')}
          value={productionStats.totalRecipes}
          icon={Factory}
          variant="default"
        />
        <StatsCard
          title={t('production.todayProductions')}
          value={productionStats.todayProductions}
          icon={CheckCircle}
          variant="success"
        />
        <StatsCard
          title={t('production.available')}
          value={productionStats.availableRecipes}
          icon={Play}
          variant="default"
        />
        <StatsCard
          title={t('production.blocked')}
          value={productionStats.blockedRecipes}
          icon={AlertTriangle}
          variant="destructive"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de Receitas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Factory className="h-5 w-5" />
              Receitas Disponíveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {recipes.filter(r => r.isActive).map((recipe) => {
                const finalProduct = getProductById(recipe.finalProductId);
                const canProduceRecipe = canProduce(recipe);

                return (
                  <div
                    key={recipe.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium">{recipe.name}</h3>
                      <p className="text-sm text-gray-500">
                        Produto: {finalProduct?.name} • Rendimento: {recipe.expectedYield}ml
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={canProduceRecipe ? 'default' : 'destructive'}>
                          {canProduceRecipe ? 'Disponível' : 'Estoque Insuficiente'}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {recipe.ingredients.length} ingrediente(s)
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleStartProduction(recipe)}
                      disabled={!canProduceRecipe}
                      size="sm"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Produzir
                    </Button>
                  </div>
                );
              })}
              {recipes.filter(r => r.isActive).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma receita cadastrada
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Histórico de Produção */}
        {showHistory && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Histórico de Produção
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receita</TableHead>
                      <TableHead>Rendimento</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Sobras</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productionRecords.slice(0, 10).map((record) => {
                      const recipe = recipes.find(r => r.id === record.recipeId);

                      return (
                        <TableRow key={record.id}>
                          <TableCell>
                            <div className="font-medium">{recipe?.name}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {record.actualYield}ml
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {record.createdAt.toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            {record.leftovers.length > 0 ? (
                              <Badge variant="secondary">
                                {record.leftovers.length} item(s)
                              </Badge>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {productionRecords.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma produção registrada
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Diálogo de Produção */}
      <Dialog open={showProductionForm} onOpenChange={setShowProductionForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Iniciar Produção - {selectedRecipe?.name}</DialogTitle>
          </DialogHeader>
          {selectedRecipe && (
            <ProductionForm
              recipe={selectedRecipe}
              onClose={() => setShowProductionForm(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo de Nova Receita */}
      <Dialog open={showRecipeForm} onOpenChange={setShowRecipeForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Receita</DialogTitle>
          </DialogHeader>
          <RecipeForm
            onClose={() => setShowRecipeForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductionManager;