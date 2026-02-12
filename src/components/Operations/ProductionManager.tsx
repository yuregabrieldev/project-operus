import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Factory, Plus, Play, History, AlertTriangle, CheckCircle,
  Package, ArrowRight, Download, FileDown
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';
import ProductionRecipeForm from './ProductionRecipeForm';
import ProductionExecutionForm from './ProductionExecutionForm';

const ProductionManager: React.FC = () => {
  const { t } = useLanguage();
  const {
    recipes = [],
    operationLogs,
    products,
    inventory,
    stores,
    getProductById
  } = useData();

  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [showExecutionForm, setShowExecutionForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  // Export filters
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [exportStoreId, setExportStoreId] = useState('all');

  // Check if a recipe can be produced
  const canProduce = (recipe: any) => {
    return recipe.ingredients.every((ingredient: any) => {
      const inventoryItem = inventory.find(item => item.productId === ingredient.productId);
      return inventoryItem && inventoryItem.currentQuantity >= ingredient.quantity;
    });
  };

  // Production statistics
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

  // Production history from logs
  const productionHistory = useMemo(() => {
    return operationLogs
      .filter(log => log.actionType === 'entry' && log.notes?.includes('Produção:'))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 20);
  }, [operationLogs]);

  // Filtered history for export
  const filteredExportHistory = useMemo(() => {
    let filtered = operationLogs.filter(
      log => log.actionType === 'entry' && log.notes?.includes('Produção:')
    );

    if (exportStartDate) {
      const start = new Date(exportStartDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter(log => log.createdAt >= start);
    }
    if (exportEndDate) {
      const end = new Date(exportEndDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(log => log.createdAt <= end);
    }
    if (exportStoreId !== 'all') {
      filtered = filtered.filter(log => log.storeId === exportStoreId);
    }

    return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [operationLogs, exportStartDate, exportEndDate, exportStoreId]);

  const handleStartProduction = (recipe: any) => {
    if (!canProduce(recipe)) {
      toast({
        title: t('production.insufficientStock'),
        description: t('production.insufficientStockDesc'),
        variant: "destructive"
      });
      return;
    }

    setSelectedRecipe(recipe);
    setShowExecutionForm(true);
  };

  const handleExportCSV = () => {
    if (filteredExportHistory.length === 0) {
      toast({
        title: t('production.exportCsv'),
        description: t('production.noDataExport'),
        variant: "destructive"
      });
      return;
    }

    const headers = [
      t('production.recipe'),
      t('production.product'),
      t('production.quantity'),
      t('production.date'),
      t('production.observations')
    ];

    const rows = filteredExportHistory.map(record => {
      const product = getProductById(record.productId);
      const store = stores.find((s: any) => s.id === record.storeId);
      return [
        record.notes?.replace('Produção: ', '') || '',
        product?.name || '',
        record.quantity.toString(),
        record.createdAt.toLocaleDateString('pt-BR') + ' ' +
        record.createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        store?.name || ''
      ];
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `producao_historico_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: t('production.exportCsv'),
      description: `${filteredExportHistory.length} registros exportados`
    });

    setShowExportDialog(false);
  };

  const stats = [
    {
      label: t('production.totalRecipes'),
      value: productionStats.totalRecipes,
      icon: Factory,
      color: 'text-blue-600',
      bgIcon: 'text-blue-400'
    },
    {
      label: t('production.todayProductions'),
      value: productionStats.todayProductions,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgIcon: 'text-emerald-400'
    },
    {
      label: t('production.available'),
      value: productionStats.availableRecipes,
      icon: Play,
      color: 'text-blue-600',
      bgIcon: 'text-blue-400'
    },
    {
      label: t('production.blocked'),
      value: productionStats.blockedRecipes,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgIcon: 'text-red-400'
    }
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t('production.title')}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{t('production.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowExportDialog(true)}
            variant="outline"
            size="sm"
            className="rounded-xl"
          >
            <FileDown className="h-4 w-4 mr-1.5" />
            {t('production.exportCsv')}
          </Button>
          <Button
            onClick={() => setShowHistory(!showHistory)}
            variant="outline"
            size="sm"
            className="rounded-xl"
          >
            <History className="h-4 w-4 mr-1.5" />
            {showHistory ? t('production.hideHistory') : t('production.viewHistory')}
          </Button>
          <Button
            onClick={() => setShowRecipeForm(true)}
            size="sm"
            className="rounded-xl bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            {t('production.newRecipe')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat, index) => (
          <Card key={index} className="border border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.bgIcon}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Available Recipes */}
      <Card className="border border-gray-100 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Factory className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">{t('production.availableRecipes')}</h3>
          </div>
          <div className="space-y-3">
            {recipes.filter((r: any) => r.isActive).map((recipe: any) => {
              const finalProduct = getProductById(recipe.finalProductId);
              const canProduceRecipe = canProduce(recipe);

              return (
                <div
                  key={recipe.id}
                  className="flex items-center justify-between p-3.5 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{recipe.name}</h4>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {t('production.product')}: {finalProduct?.name} • {t('production.yield')}: {recipe.expectedYield}{recipe.yieldUnit || 'ml'}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge
                        className={canProduceRecipe
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                          : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-50'
                        }
                      >
                        {canProduceRecipe ? t('production.available') : t('production.insufficientStock')}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {recipe.ingredients.length} {t('production.ingredients')}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleStartProduction(recipe)}
                    disabled={!canProduceRecipe}
                    size="sm"
                    className={`rounded-xl ${canProduceRecipe
                      ? 'bg-gray-900 hover:bg-gray-800 text-white'
                      : 'opacity-50 cursor-not-allowed'
                      }`}
                  >
                    <Play className="h-3.5 w-3.5 mr-1.5" />
                    {t('production.produce')}
                  </Button>
                </div>
              );
            })}

            {recipes.filter((r: any) => r.isActive).length === 0 && (
              <div className="text-center py-12">
                <Factory className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">{t('production.noRecipes')}</p>
                <Button
                  onClick={() => setShowRecipeForm(true)}
                  className="mt-3"
                  variant="outline"
                  size="sm"
                >
                  {t('production.createFirstRecipe')}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Production History */}
      {showHistory && (
        <Card className="border border-gray-100 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <History className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">{t('production.historyTitle')}</h3>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">{t('production.recipe')}</TableHead>
                    <TableHead className="font-semibold">{t('production.yield')}</TableHead>
                    <TableHead className="font-semibold">{t('production.date')}</TableHead>
                    <TableHead className="font-semibold">{t('production.observations')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productionHistory.map((record) => {
                    const product = getProductById(record.productId);

                    return (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.notes?.replace('Produção: ', '') || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            {record.quantity}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {record.createdAt.toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {product?.name}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {productionHistory.length === 0 && (
              <div className="text-center py-8">
                <History className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">{t('production.noHistory')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* CSV Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileDown className="h-5 w-5" />
              {t('production.exportTitle')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Date Filters */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{t('production.startDate')}</Label>
                <Input
                  type="date"
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{t('production.endDate')}</Label>
                <Input
                  type="date"
                  value={exportEndDate}
                  onChange={(e) => setExportEndDate(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>

            {/* Store Filter */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t('production.store')}</Label>
              <Select value={exportStoreId} onValueChange={setExportStoreId}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('production.allStores')}</SelectItem>
                  {stores.filter((s: any) => s.isActive).map((store: any) => (
                    <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Preview count */}
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{filteredExportHistory.length}</span> registros encontrados
              </p>
            </div>

            {/* Export History Table Preview */}
            {filteredExportHistory.length > 0 && (
              <div className="max-h-48 overflow-y-auto border rounded-xl">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">{t('production.recipe')}</TableHead>
                      <TableHead className="text-xs">{t('production.yield')}</TableHead>
                      <TableHead className="text-xs">{t('production.date')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExportHistory.slice(0, 10).map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="text-xs">{record.notes?.replace('Produção: ', '') || '-'}</TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                            {record.quantity}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">
                          {record.createdAt.toLocaleDateString('pt-BR')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Download Button */}
            <Button
              onClick={handleExportCSV}
              className="w-full rounded-xl bg-blue-600 hover:bg-blue-700"
              disabled={filteredExportHistory.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              {t('production.download')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Recipe Dialog */}
      <Dialog open={showRecipeForm} onOpenChange={setShowRecipeForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('production.newRecipe')}</DialogTitle>
          </DialogHeader>
          <ProductionRecipeForm
            onClose={() => setShowRecipeForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Production Execution Dialog */}
      <Dialog open={showExecutionForm} onOpenChange={setShowExecutionForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('production.startProduction')} - {selectedRecipe?.name}</DialogTitle>
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
  );
};

export default ProductionManager;
