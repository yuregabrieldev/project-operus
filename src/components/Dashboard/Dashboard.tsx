
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { Package, AlertTriangle, FileText, Wallet, TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react';
import FinanceSummary from './FinanceSummary';

const Dashboard: React.FC = () => {
  const { t } = useLanguage();
  const { products, inventory, invoices, cashRegisters, movements, getLowStockItems, getOverdueInvoices, getOpenCashRegisters } = useData();

  const lowStockItems = getLowStockItems();
  const overdueInvoices = getOverdueInvoices();
  const openCashRegisters = getOpenCashRegisters();
  const recentMovements = movements.slice(-5);

  const stats = [
    {
      title: t('dashboard.totalProducts'),
      value: products.length,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: t('dashboard.lowStock'),
      value: lowStockItems.length,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      title: t('dashboard.pendingInvoices'),
      value: overdueInvoices.length,
      icon: FileText,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      title: t('dashboard.openCashbox'),
      value: openCashRegisters.length,
      icon: Wallet,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    }
  ];

  const getMovementLabel = (type: string) => {
    switch (type) {
      case 'in': return t('dashboard.entry');
      case 'out': return t('dashboard.exit');
      case 'transfer': return t('dashboard.transfer');
      default: return type;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.title')}</h1>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Tabbed Navigation */}
      <Tabs defaultValue="operacional" className="w-full">
        <TabsList className="w-full justify-start gap-0 bg-transparent border-b border-gray-200 rounded-none p-0 h-auto">
          <TabsTrigger
            value="operacional"
            className="relative rounded-none border-b-2 border-transparent px-6 py-3 text-sm font-medium text-gray-500 shadow-none transition-all data-[state=active]:border-b-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none hover:text-gray-700 gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            {t('dashboard.operationalSummary')}
          </TabsTrigger>
          <TabsTrigger
            value="financeiro"
            className="relative rounded-none border-b-2 border-transparent px-6 py-3 text-sm font-medium text-gray-500 shadow-none transition-all data-[state=active]:border-b-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none hover:text-gray-700 gap-2"
          >
            <DollarSign className="h-4 w-4" />
            {t('dashboard.financialSummary')}
          </TabsTrigger>
        </TabsList>

        {/* Tab: Resumo Financeiro */}
        <TabsContent value="financeiro" className="mt-6">
          <FinanceSummary />
        </TabsContent>

        {/* Tab: Resumo Operacional */}
        <TabsContent value="operacional" className="mt-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      </div>
                      <div className={`p-3 rounded-full ${stat.bgColor}`}>
                        <Icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Movements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {t('dashboard.recentMovements')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentMovements.map((movement) => (
                    <div key={movement.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${movement.type === 'in' ? 'bg-green-500' :
                          movement.type === 'out' ? 'bg-red-500' : 'bg-blue-500'
                          }`} />
                        <div>
                          <p className="text-sm font-medium">
                            {getMovementLabel(movement.type)}
                          </p>
                          <p className="text-xs text-gray-600">
                            {t('dashboard.qty')}: {movement.quantity}
                          </p>
                        </div>
                      </div>
                      <Badge variant={movement.status === 'delivered' ? 'default' : 'secondary'}>
                        {movement.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  {t('dashboard.alerts')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lowStockItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-red-800">{t('dashboard.lowStock')}</p>
                        <p className="text-xs text-red-600">
                          {t('common.product')}: {item.productId} - {t('dashboard.qty')}: {item.currentQuantity}
                        </p>
                      </div>
                      <Badge variant="destructive">{t('dashboard.critical')}</Badge>
                    </div>
                  ))}

                  {overdueInvoices.slice(0, 2).map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-yellow-800">{t('dashboard.invoice')}</p>
                        <p className="text-xs text-yellow-600">
                          {invoice.invoiceNumber} - R$ {invoice.amount.toFixed(2)}
                        </p>
                      </div>
                      <Badge variant="secondary">{t('dashboard.overdue')}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
