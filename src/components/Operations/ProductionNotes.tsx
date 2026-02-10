
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface ProductionNotesProps {
  notes: string;
  onNotesChange: (notes: string) => void;
}

const ProductionNotes: React.FC<ProductionNotesProps> = ({ notes, onNotesChange }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Observações</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Observações sobre a produção (opcional)..."
          rows={3}
        />
      </CardContent>
    </Card>
  );
};

export default ProductionNotes;
