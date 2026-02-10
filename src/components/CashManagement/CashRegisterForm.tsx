
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useData } from '@/contexts/DataContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface CashRegisterFormProps {
  cashRegisterId?: string | null;
  onClose: () => void;
}

const CashRegisterForm: React.FC<CashRegisterFormProps> = ({ cashRegisterId, onClose }) => {
  const { t } = useLanguage();
  const { 
    stores, 
    cashRegisters, 
    addCashRegister, 
    updateCashRegister 
  } = useData();

  const [formData, setFormData] = useState({
    storeId: '',
    openingBalance: 0,
    closingBalance: 0,
    justification: ''
  });

  const isClosing = !!cashRegisterId;
  const existingCashRegister = cashRegisterId ? 
    cashRegisters.find(cr => cr.id === cashRegisterId) : null;

  useEffect(() => {
    if (existingCashRegister) {
      setFormData({
        storeId: existingCashRegister.storeId,
        openingBalance: existingCashRegister.openingBalance,
        closingBalance: existingCashRegister.closingBalance || 0,
        justification: ''
      });
    }
  }, [existingCashRegister]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isClosing && !formData.storeId) {
      toast.error('Selecione uma loja');
      return;
    }

    if (!isClosing && formData.openingBalance < 0) {
      toast.error('Saldo inicial deve ser maior ou igual a zero');
      return;
    }

    if (isClosing && formData.closingBalance < 0) {
      toast.error('Saldo final deve ser maior ou igual a zero');
      return;
    }

    try {
      if (isClosing && cashRegisterId) {
        // Closing cash register
        const difference = formData.closingBalance - formData.openingBalance;
        const hasSignificantDifference = Math.abs(difference) > (formData.openingBalance * 0.05); // 5% difference

        if (hasSignificantDifference && !formData.justification.trim()) {
          toast.error('Justificativa é obrigatória para diferenças significativas');
          return;
        }

        updateCashRegister(cashRegisterId, {
          closingBalance: formData.closingBalance,
          closedAt: new Date(),
          closedBy: 'current-user',
          status: 'closed'
        });

        toast.success('Caixa fechado com sucesso!');
      } else {
        // Opening cash register
        const newCashRegister = {
          storeId: formData.storeId,
          openingBalance: formData.openingBalance,
          openedAt: new Date(),
          openedBy: 'current-user',
          status: 'open' as const
        };
        
        addCashRegister(newCashRegister);
        toast.success('Caixa aberto com sucesso!');
      }
      
      onClose();
    } catch (error) {
      toast.error('Erro ao processar caixa');
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const difference = isClosing ? formData.closingBalance - formData.openingBalance : 0;
  const hasSignificantDifference = Math.abs(difference) > (formData.openingBalance * 0.05);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isClosing ? 'Fechar Caixa' : 'Abrir Caixa'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isClosing && (
            <div className="space-y-2">
              <Label htmlFor="store">Loja *</Label>
              <Select value={formData.storeId} onValueChange={(value) => handleInputChange('storeId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a loja" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="openingBalance">
              {isClosing ? 'Saldo Inicial' : 'Saldo Inicial *'}
            </Label>
            <Input
              id="openingBalance"
              type="number"
              step="0.01"
              value={formData.openingBalance}
              onChange={(e) => handleInputChange('openingBalance', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              disabled={isClosing}
              required={!isClosing}
            />
          </div>

          {isClosing && (
            <>
              <div className="space-y-2">
                <Label htmlFor="closingBalance">Saldo Final *</Label>
                <Input
                  id="closingBalance"
                  type="number"
                  step="0.01"
                  value={formData.closingBalance}
                  onChange={(e) => handleInputChange('closingBalance', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Diferença:</span>
                  <span className={`font-bold ${difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(difference)}
                  </span>
                </div>
                {hasSignificantDifference && (
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠️ Diferença significativa detectada. Justificativa obrigatória.
                  </p>
                )}
              </div>

              {hasSignificantDifference && (
                <div className="space-y-2">
                  <Label htmlFor="justification">Justificativa *</Label>
                  <Textarea
                    id="justification"
                    value={formData.justification}
                    onChange={(e) => handleInputChange('justification', e.target.value)}
                    placeholder="Explique a diferença encontrada..."
                    required
                  />
                </div>
              )}
            </>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button 
              type="submit" 
              className={isClosing ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
            >
              {isClosing ? 'Fechar Caixa' : 'Abrir Caixa'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CashRegisterForm;
