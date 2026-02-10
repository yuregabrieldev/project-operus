
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { Search, Package, Minus, History, AlertTriangle, Factory, Boxes, FlaskConical } from 'lucide-react';
import StockWithdrawalForm from './StockWithdrawalForm';
import ProductionManager from './ProductionManager';

const OperationsManager: React.FC = () => {
  const { t } = useLanguage();
  const { 
    products, 
    categories, 
    stores,
    inventory,
    operationLogs,
    getProductById, 
    getCategoryById,
    getStoreById,
    getOperationLogsByProduct,
    getInventoryByStore
  } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Filtrar produtos disponíveis para retirada
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = !searchTerm || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || product.categoryId === selectedCategory;
      
      // Verificar se há estoque disponível na loja selecionada
      const hasStock = inventory.some(item => 
        item.productId === product.id && 
        (selectedStore === 'all' || item.storeId === selectedStore) &&
        item.currentQuantity > 0
      );
      
      return matchesSearch && matchesCategory && hasStock;
    });
  }, [products, searchTerm, selectedCategory, selectedStore, inventory]);

  // Obter estoque de um produto
  const getProductStock = (productId: string, storeId?: string) => {
    const inventoryItems = inventory.filter(item => 
      item.productId === productId && 
      (!storeId || item.storeId === storeId)
    );
    return inventoryItems.reduce((total, item) => total + item.currentQuantity, 0);
  };

  // Obter logs recentes
  const recentLogs = useMemo(() => {
    return operationLogs
      .filter(log => selectedStore === 'all' || log.storeId === selectedStore)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);
  }, [operationLogs, selectedStore]);

  const handleWithdrawStock = (productId: string) => {
    setSelectedProduct(productId);
    setShowWithdrawalForm(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Centro de Operações
            </h1>
            <p className="text-gray-600">Gestão completa de estoque, retiradas e produção</p>
          </div>
        </div>

        {/* Tabs for different operations */}
        <Tabs defaultValue="withdrawal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white shadow-md">
            <TabsTrigger value="withdrawal" className="flex items-center gap-2">
              <Boxes className="h-4 w-4" />
              Retirada de Estoque
            </TabsTrigger>
            <TabsTrigger value="production" className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4" />
              Produção
            </TabsTrigger>
          </TabsList>

          {/* Stock Withdrawal Tab */}
          <TabsContent value="withdrawal" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">Retirada de Estoque</h2>
              <Button 
                onClick={() => setShowHistory(!showHistory)} 
                variant="outline"
                className="shadow-md"
              >
                <History className="h-4 w-4 mr-2" />
                {showHistory ? 'Ocultar Histórico' : 'Ver Histórico'}
              </Button>
            </div>

            {/* Filtros */}
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Buscar produtos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 border-gray-200 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <Select value={selectedStore} onValueChange={setSelectedStore}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Selecionar loja..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Lojas</SelectItem>
                      {stores.map(store => (
                        <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Selecionar categoria..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Categorias</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Lista de Produtos */}
              <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-indigo-50">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-6 w-6 text-indigo-600" />
                    Produtos Disponíveis
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {filteredProducts.map((product) => {
                      const category = getCategoryById(product.categoryId);
                      const stock = getProductStock(product.id, selectedStore !== 'all' ? selectedStore : undefined);
                      const isLowStock = inventory.some(item => 
                        item.productId === product.id && 
                        item.currentQuantity <= item.minQuantity
                      );
                      
                      return (
                        <div 
                          key={product.id} 
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{product.name}</h3>
                            <p className="text-sm text-gray-500">{category?.name} • SKU: {product.sku}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge 
                                variant={isLowStock ? 'destructive' : 'default'}
                                className={isLowStock 
                                  ? 'bg-red-100 text-red-700 border-red-200' 
                                  : 'bg-green-100 text-green-700 border-green-200'
                                }
                              >
                                {stock} unidades
                              </Badge>
                              {isLowStock && (
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                          </div>
                          <Button
                            onClick={() => handleWithdrawStock(product.id)}
                            disabled={stock === 0}
                            size="sm"
                            className={stock > 0 
                              ? 'bg-indigo-600 hover:bg-indigo-700' 
                              : 'opacity-50 cursor-not-allowed'
                            }
                          >
                            <Minus className="h-4 w-4 mr-2" />
                            Retirar
                          </Button>
                        </div>
                      );
                    })}
                    {filteredProducts.length === 0 && (
                      <div className="text-center py-12">
                        <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">
                          Nenhum produto disponível com os filtros aplicados
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Histórico Recente */}
              {showHistory && (
                <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-purple-50">
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-6 w-6 text-purple-600" />
                      Operações Recentes
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
                            <TableHead className="font-semibold">Usuário</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recentLogs.map((log) => {
                            const product = getProductById(log.productId);
                            const store = getStoreById(log.storeId);
                            
                            return (
                              <TableRow key={log.id} className="hover:bg-gray-50/50">
                                <TableCell>
                                  <div>
                                    <div className="font-medium">{product?.name}</div>
                                    <div className="text-sm text-gray-500">{store?.name}</div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={log.actionType === 'withdrawal' ? 'destructive' : 'default'}
                                    className={log.actionType === 'withdrawal' 
                                      ? 'bg-red-100 text-red-700 border-red-200' 
                                      : 'bg-green-100 text-green-700 border-green-200'
                                    }
                                  >
                                    {log.actionType === 'withdrawal' ? '-' : '+'}{log.quantity}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-gray-600">
                                  {log.createdAt.toLocaleDateString('pt-BR')} {log.createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </TableCell>
                                <TableCell className="text-gray-600">{log.userId}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                    {recentLogs.length === 0 && (
                      <div className="text-center py-8">
                        <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">Nenhuma operação recente</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Production Tab */}
          <TabsContent value="production">
            <ProductionManager />
          </TabsContent>
        </Tabs>

        {/* Modal de Retirada */}
        {showWithdrawalForm && selectedProduct && (
          <StockWithdrawalForm
            productId={selectedProduct}
            storeId={selectedStore !== 'all' ? selectedStore : undefined}
            onClose={() => {
              setShowWithdrawalForm(false);
              setSelectedProduct(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default OperationsManager;
