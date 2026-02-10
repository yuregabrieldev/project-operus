
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Factory, Plus, Play, History, AlertTriangle, CheckCircle, Package, Leaf, ArrowRight } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { toast } from '@/hooks/use-toast';
import ProductionRecipeForm from './ProductionRecipeForm';
import ProductionExecutionForm from './ProductionExecutionForm';

const ProductionManager: React.FC = () => {
  const { 
    recipes = [],
    operationLogs,
    products,
    inventory,
    getProductById
  } = useData();

  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [showExecutionForm, setShowExecutionForm] = useState(false);
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
    const todayRecords = operationLogs.filter(log => 
      log.createdAt.toDateString() === today.toDateString() && 
      log.actionType === 'entry' &&
      log.notes?.includes('Produção:')
    );

    return {
      totalRecipes: recipes.filter((r: any) => r.isActive).length,
      todayProductions: todayRecords.length,
      availableRecipes: recipes.filter((r: any) => r.isActive && canProduce(r)).length,
      blockedRecipes: recipes.filter((r: any) => r.isActive && !canProduce(r)).length
    };
  }, [recipes, operationLogs, inventory]);

  // Histórico de produção baseado nos logs
  const productionHistory = useMemo(() => {
    return operationLogs
      .filter(log => log.actionType === 'entry' && log.notes?.includes('Produção:'))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 20);
  }, [operationLogs]);

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
    setShowExecutionForm(true);
  };

  const getIngredientsSummary = (recipe: any) => {
    return recipe.ingredients.map((ing: any) => {
      const product = getProductById(ing.productId);
      return `${ing.quantity} ${ing.unit} ${product?.name}`;
    }).join(', ');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Gestão de Produção
            </h1>
            <p className="text-gray-600">Controle de insumos → produtos finais + gestão de sobras</p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => setShowHistory(!showHistory)} 
              variant="outline"
              className="shadow-md"
            >
              <History className="h-4 w-4 mr-2" />
              {showHistory ? 'Ocultar Histórico' : 'Ver Histórico'}
            </Button>
            <Button 
              onClick={() => setShowRecipeForm(true)}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Fórmula
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Fórmulas</p>
                  <p className="text-3xl font-bold">{productionStats.totalRecipes}</p>
                </div>
                <Factory className="h-10 w-10 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Produções Hoje</p>
                  <p className="text-3xl font-bold">{productionStats.todayProductions}</p>
                </div>
                <CheckCircle className="h-10 w-10 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Disponíveis</p>
                  <p className="text-3xl font-bold">{productionStats.availableRecipes}</p>
                </div>
                <Play className="h-10 w-10 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Bloqueadas</p>
                  <p className="text-3xl font-bold">{productionStats.blockedRecipes}</p>
                </div>
                <AlertTriangle className="h-10 w-10 text-red-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lista de Fórmulas */}
          <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-green-50">
              <CardTitle className="flex items-center gap-2">
                <Factory className="h-6 w-6 text-green-600" />
                Fórmulas Disponíveis
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {recipes.filter((r: any) => r.isActive).map((recipe: any) => {
                  const finalProduct = getProductById(recipe.finalProductId);
                  const canProduceRecipe = canProduce(recipe);
                  
                  return (
                    <div 
                      key={recipe.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{recipe.name}</h3>
                        <div className="space-y-1 mt-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Package className="h-4 w-4" />
                            <span>{getIngredientsSummary(recipe)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <ArrowRight className="h-4 w-4" />
                            <span>{finalProduct?.name} ({recipe.expectedYield} {recipe.yieldUnit})</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <Badge 
                            variant={canProduceRecipe ? 'default' : 'destructive'}
                            className={canProduceRecipe 
                              ? 'bg-green-100 text-green-700 border-green-200' 
                              : 'bg-red-100 text-red-700 border-red-200'
                            }
                          >
                            {canProduceRecipe ? 'Disponível' : 'Estoque Insuficiente'}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleStartProduction(recipe)}
                        disabled={!canProduceRecipe}
                        size="sm"
                        className={canProduceRecipe 
                          ? 'bg-green-600 hover:bg-green-700' 
                          : 'opacity-50 cursor-not-allowed'
                        }
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Produzir
                      </Button>
                    </div>
                  );
                })}
                {recipes.filter((r: any) => r.isActive).length === 0 && (
                  <div className="text-center py-12">
                    <Factory className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">Nenhuma fórmula cadastrada</p>
                    <Button 
                      onClick={() => setShowRecipeForm(true)}
                      className="mt-4"
                      variant="outline"
                    >
                      Criar primeira fórmula
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Histórico de Produção */}
          {showHistory && (
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50">
                <CardTitle className="flex items-center gap-2">
                  <History className="h-6 w-6 text-blue-600" />
                  Histórico de Produção
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/50">
                        <TableHead className="font-semibold">Produto</TableHead>
                        <TableHead className="font-semibold">Quantidade</TableHead>
                        <TableHead className="font-semibold">Data</TableHead>
                        <TableHead className="font-semibold">Observações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productionHistory.map((record) => {
                        const product = getProductById(record.productId);
                        
                        return (
                          <TableRow key={record.id} className="hover:bg-gray-50/50">
                            <TableCell>
                              <div className="font-medium">{product?.name}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                +{record.quantity}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-600">
                              {record.createdAt.toLocaleDateString('pt-BR')} {record.createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {record.notes}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                {productionHistory.length === 0 && (
                  <div className="text-center py-8">
                    <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhuma produção registrada hoje</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Diálogo de Nova Fórmula */}
        <Dialog open={showRecipeForm} onOpenChange={setShowRecipeForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Fórmula de Produção</DialogTitle>
            </DialogHeader>
            <ProductionRecipeForm 
              onClose={() => setShowRecipeForm(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Diálogo de Execução */}
        <Dialog open={showExecutionForm} onOpenChange={setShowExecutionForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Executar Produção - {selectedRecipe?.name}</DialogTitle>
            </DialogHeader>
            {selectedRecipe && (
              <ProductionExecutionForm 
                recipe={selectedRecipe}
                onClose={() => setShowExecutionForm(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ProductionManager;
