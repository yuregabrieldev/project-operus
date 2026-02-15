
import React from 'react';
import { Button } from '@/components/ui/button';

interface ProductionActionsProps {
  canExecuteProduction: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

const ProductionActions: React.FC<ProductionActionsProps> = ({
  canExecuteProduction,
  onCancel,
  onSubmit
}) => {
  return (
    <div className="flex justify-end gap-2">
      <Button onClick={onCancel} variant="outline">
        Cancelar
      </Button>
      <Button
        onClick={onSubmit}
        disabled={!canExecuteProduction}
        className={canExecuteProduction ? '' : 'opacity-50 cursor-not-allowed'}
      >
        {canExecuteProduction ? 'Executar Produção' : 'Estoque Insuficiente'}
      </Button>
    </div>
  );
};

export default ProductionActions;
