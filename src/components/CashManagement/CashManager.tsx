
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { DollarSign, Plus, X, CheckCircle } from 'lucide-react';
import CashRegisterForm from './CashRegisterForm';

const CashManager: React.FC = () => {
  const { t } = useLanguage();
  const { cashRegisters, stores, getStoreById } = useData();
  const [showForm, setShowForm] = useState(false);
  const [selectedCashRegister, setSelectedCashRegister] = useState<string | null>(null);

  const openCashRegisters = cashRegisters.filter(cr => cr.status === 'open');
  const closedCashRegisters = cashRegisters.filter(cr => cr.status === 'closed').slice(0, 10);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleOpenCash = () => {
    setSelectedCashRegister(null);
    setShowForm(true);
  };

  const handleCloseCash = (cashRegisterId: string) => {
    setSelectedCashRegister(cashRegisterId);
    setShowForm(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('cash.title')}</h1>
        <Button onClick={handleOpenCash} className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          {t('cash.openCash')}
        </Button>
      </div>

      {/* Open Cash Registers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Caixas Abertos ({openCashRegisters.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {openCashRegisters.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum caixa aberto no momento</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {openCashRegisters.map((cashRegister) => {
                const store = getStoreById(cashRegister.storeId);
                return (
                  <div key={cashRegister.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-green-800">{store?.name}</h3>
                      <Badge className="bg-green-600">Aberto</Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Saldo Inicial:</span>
                        <span className="font-medium">{formatCurrency(cashRegister.openingBalance)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Aberto em:</span>
                        <span className="font-medium">{formatDate(cashRegister.openedAt)}</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleCloseCash(cashRegister.id)}
                      className="w-full mt-4 bg-red-600 hover:bg-red-700"
                      size="sm"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Fechar Caixa
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Closed Cash Registers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-gray-600" />
            Últimos Fechamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loja</TableHead>
                  <TableHead>Saldo Inicial</TableHead>
                  <TableHead>Saldo Final</TableHead>
                  <TableHead>Diferença</TableHead>
                  <TableHead>Aberto em</TableHead>
                  <TableHead>Fechado em</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {closedCashRegisters.map((cashRegister) => {
                  const store = getStoreById(cashRegister.storeId);
                  const difference = (cashRegister.closingBalance || 0) - cashRegister.openingBalance;
                  
                  return (
                    <TableRow key={cashRegister.id}>
                      <TableCell className="font-medium">{store?.name}</TableCell>
                      <TableCell>{formatCurrency(cashRegister.openingBalance)}</TableCell>
                      <TableCell>{formatCurrency(cashRegister.closingBalance || 0)}</TableCell>
                      <TableCell>
                        <span className={`font-medium ${difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(difference)}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(cashRegister.openedAt)}</TableCell>
                      <TableCell>
                        {cashRegister.closedAt ? formatDate(cashRegister.closedAt) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">Fechado</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Cash Register Form Modal */}
      {showForm && (
        <CashRegisterForm
          cashRegisterId={selectedCashRegister}
          onClose={() => {
            setShowForm(false);
            setSelectedCashRegister(null);
          }}
        />
      )}
    </div>
  );
};

export default CashManager;
