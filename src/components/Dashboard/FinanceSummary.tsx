
import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react';
import { FinanceChart } from './FinanceChart';

interface FinanceData {
  receitas: number;
  despesas: number;
  saldo: number;
  margem: number;
}

const FinanceSummary: React.FC = () => {
  const { t } = useLanguage();
  const { cashRegisters, invoices } = useData();
  const [period, setPeriod] = useState('30'); // dias

  const calculateFinanceData = (days: number): FinanceData => {
    const now = new Date();
    const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));

    // Calcular receitas dos registros de caixa fechados
    const receitas = cashRegisters
      .filter(register =>
        new Date(register.openedAt) >= startDate &&
        register.status === 'closed' &&
        register.closingBalance !== undefined
      )
      .reduce((total, register) => {
        const sales = (register.closingBalance || 0) - register.openingBalance;
        return total + Math.max(0, sales); // Apenas valores positivos
      }, 0);

    // Calcular despesas das faturas pagas
    const despesas = invoices
      .filter(invoice =>
        invoice.status === 'paid' &&
        invoice.dueDate &&
        new Date(invoice.dueDate) >= startDate
      )
      .reduce((total, invoice) => total + invoice.amount, 0);

    const saldo = receitas - despesas;
    const margem = receitas > 0 ? (saldo / receitas) * 100 : 0;

    return { receitas, despesas, saldo, margem };
  };

  const financeData = calculateFinanceData(parseInt(period));

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const getMonthlyData = () => {
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const monthReceitas = cashRegisters
        .filter(register => {
          const registerDate = new Date(register.openedAt);
          return registerDate >= monthDate &&
            registerDate < nextMonth &&
            register.status === 'closed' &&
            register.closingBalance !== undefined;
        })
        .reduce((total, register) => {
          const sales = (register.closingBalance || 0) - register.openingBalance;
          return total + Math.max(0, sales);
        }, 0);

      const monthDespesas = invoices
        .filter(invoice => {
          const invoiceDate = invoice.dueDate ? new Date(invoice.dueDate) : null;
          return invoiceDate && invoiceDate >= monthDate && invoiceDate < nextMonth && invoice.status === 'paid';
        })
        .reduce((total, invoice) => total + invoice.amount, 0);

      months.push({
        month: monthDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        receitas: monthReceitas,
        despesas: monthDespesas
      });
    }

    return months;
  };

  return (
    <div className="space-y-6">
      {/* Header com filtro de período */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">{t('finance.title')}</h2>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t('finance.selectPeriod')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">{t('finance.periods.today')}</SelectItem>
            <SelectItem value="7">{t('finance.periods.last7days')}</SelectItem>
            <SelectItem value="30">{t('finance.periods.last30days')}</SelectItem>
            <SelectItem value="90">{t('finance.periods.last3months')}</SelectItem>
            <SelectItem value="365">{t('finance.periods.lastYear')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cards de resumo financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Receitas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('finance.revenue')}</CardTitle>
            <div className="h-4 w-4 text-green-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(financeData.receitas)}
            </div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +12% {t('finance.comparePeriod')}
            </p>
          </CardContent>
        </Card>

        {/* Despesas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('finance.expenses')}</CardTitle>
            <div className="h-4 w-4 text-red-600">
              <TrendingDown className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(financeData.despesas)}
            </div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              -5% {t('finance.comparePeriod')}
            </p>
          </CardContent>
        </Card>

        {/* Saldo */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('finance.balance')}</CardTitle>
            <div className="h-4 w-4 text-blue-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${financeData.saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatCurrency(financeData.saldo)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('finance.revenue')} - {t('finance.expenses')}
            </p>
          </CardContent>
        </Card>

        {/* Margem */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('finance.margin')}</CardTitle>
            <div className="h-4 w-4 text-purple-600">
              <Target className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${financeData.margem >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
              {formatPercentage(financeData.margem)}
            </div>
            <p className="text-xs text-muted-foreground">
              ({t('finance.balance')} / {t('finance.revenue')}) × 100
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de fluxo financeiro */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('finance.financialFlow')}</CardTitle>
          </CardHeader>
          <CardContent>
            <FinanceChart data={getMonthlyData()} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinanceSummary;
