import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { useData } from '@/contexts/DataContext';

interface ChecklistTemplate {
  id?: string;
  name: string;
  type: 'opening' | 'closing' | 'quality' | 'custom';
  items: ChecklistItem[];
  associatedStores: string[];
  isActive: boolean;
}

interface ChecklistItem {
  id: string;
  question: string;
  description?: string;
  requiresComment: boolean;
  requiresImage: boolean;
  applicableStores: string[];
  applicableDays: number[];
  isOptional: boolean;
}

interface Props {
  template?: ChecklistTemplate | null;
  onSave: (template: Partial<ChecklistTemplate>) => void;
  onCancel: () => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
];

export const ChecklistTemplateForm: React.FC<Props> = ({ template, onSave, onCancel }) => {
  const { stores } = useData();

  const [formData, setFormData] = useState<ChecklistTemplate>({
    name: '',
    type: 'custom',
    items: [],
    associatedStores: [],
    isActive: true,
  });

  useEffect(() => {
    if (template) {
      setFormData(template);
    } else {
      setFormData({
        name: '',
        type: 'custom',
        items: [],
        associatedStores: [],
        isActive: true,
      });
    }
  }, [template]);

  const addNewItem = () => {
    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      question: '',
      description: '',
      requiresComment: false,
      requiresImage: false,
      applicableStores: ['all'],
      applicableDays: [0, 1, 2, 3, 4, 5, 6],
      isOptional: false,
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const updateItem = (itemId: string, updates: Partial<ChecklistItem>) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      )
    }));
  };

  const removeItem = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };

  const toggleDay = (itemId: string, day: number) => {
    const item = formData.items.find(i => i.id === itemId);
    if (!item) return;

    const newDays = item.applicableDays.includes(day)
      ? item.applicableDays.filter(d => d !== day)
      : [...item.applicableDays, day];

    updateItem(itemId, { applicableDays: newDays });
  };

  const toggleStore = (itemId: string, storeId: string) => {
    const item = formData.items.find(i => i.id === itemId);
    if (!item) return;

    let newStores: string[];

    if (storeId === 'all') {
      newStores = item.applicableStores.includes('all') ? [] : ['all'];
    } else {
      // Remove 'all' if selecting specific stores
      const currentStores = item.applicableStores.filter(s => s !== 'all');
      newStores = currentStores.includes(storeId)
        ? currentStores.filter(s => s !== storeId)
        : [...currentStores, storeId];
    }

    updateItem(itemId, { applicableStores: newStores });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Nome é obrigatório');
      return;
    }

    if (formData.items.length === 0) {
      alert('Adicione pelo menos um item ao checklist');
      return;
    }

    // Validar se todos os itens têm pergunta
    const invalidItems = formData.items.filter(item => !item.question.trim());
    if (invalidItems.length > 0) {
      alert('Todos os itens devem ter uma pergunta');
      return;
    }

    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Template</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Checklist Abertura"
              required
            />
          </div>

          <div>
            <Label htmlFor="type">Tipo</Label>
            <Select
              value={formData.type}
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="opening">Abertura</SelectItem>
                <SelectItem value="closing">Fechamento</SelectItem>
                <SelectItem value="quality">Qualidade</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Lojas Associadas</Label>
            <div className="space-y-2 mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="all-stores"
                  checked={formData.associatedStores.includes('all')}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFormData(prev => ({ ...prev, associatedStores: ['all'] }));
                    } else {
                      setFormData(prev => ({ ...prev, associatedStores: [] }));
                    }
                  }}
                />
                <Label htmlFor="all-stores">Todas as lojas</Label>
              </div>

              {!formData.associatedStores.includes('all') && (
                <div className="grid grid-cols-2 gap-2 ml-6">
                  {stores.map(store => (
                    <div key={store.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`store-${store.id}`}
                        checked={formData.associatedStores.includes(store.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData(prev => ({
                              ...prev,
                              associatedStores: [...prev.associatedStores, store.id]
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              associatedStores: prev.associatedStores.filter(id => id !== store.id)
                            }));
                          }
                        }}
                      />
                      <Label htmlFor={`store-${store.id}`} className="text-sm">
                        {store.name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checklist Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Itens do Checklist</CardTitle>
          <Button type="button" onClick={addNewItem} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.items.map((item, index) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-start gap-4">
                <GripVertical className="h-5 w-5 text-muted-foreground mt-2 cursor-move" />

                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">Item {index + 1}</Badge>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => removeItem(item.id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  <div>
                    <Label>Pergunta *</Label>
                    <Input
                      value={item.question}
                      onChange={(e) => updateItem(item.id, { question: e.target.value })}
                      placeholder="Ex: Equipamentos ligados e funcionando?"
                      required
                    />
                  </div>

                  <div>
                    <Label>Descrição/Observações</Label>
                    <Textarea
                      value={item.description || ''}
                      onChange={(e) => updateItem(item.id, { description: e.target.value })}
                      placeholder="Informações adicionais sobre o item..."
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Obrigatoriedades</Label>
                      <div className="space-y-2 mt-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={item.requiresComment}
                            onCheckedChange={(checked) =>
                              updateItem(item.id, { requiresComment: !!checked })
                            }
                          />
                          <Label className="text-sm">Comentário obrigatório</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={item.requiresImage}
                            onCheckedChange={(checked) =>
                              updateItem(item.id, { requiresImage: !!checked })
                            }
                          />
                          <Label className="text-sm">Imagem obrigatória</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={item.isOptional}
                            onCheckedChange={(checked) =>
                              updateItem(item.id, { isOptional: !!checked })
                            }
                          />
                          <Label className="text-sm">Item opcional</Label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Dias da Semana</Label>
                      <div className="grid grid-cols-2 gap-1 mt-2">
                        {DAYS_OF_WEEK.map(day => (
                          <div key={day.value} className="flex items-center space-x-2">
                            <Checkbox
                              checked={item.applicableDays.includes(day.value)}
                              onCheckedChange={() => toggleDay(item.id, day.value)}
                            />
                            <Label className="text-xs">{day.label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Lojas Aplicáveis</Label>
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={item.applicableStores.includes('all')}
                          onCheckedChange={() => toggleStore(item.id, 'all')}
                        />
                        <Label className="text-sm">Todas as lojas</Label>
                      </div>

                      {!item.applicableStores.includes('all') && (
                        <div className="grid grid-cols-2 gap-2 ml-6">
                          {stores.map(store => (
                            <div key={store.id} className="flex items-center space-x-2">
                              <Checkbox
                                checked={item.applicableStores.includes(store.id)}
                                onCheckedChange={() => toggleStore(item.id, store.id)}
                              />
                              <Label className="text-xs">{store.name}</Label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {formData.items.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum item adicionado ainda.</p>
              <p className="text-sm">Clique em "Adicionar Item" para começar.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {template ? 'Atualizar' : 'Criar'} Template
        </Button>
      </div>
    </form>
  );
};