import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Plus,
  Trash2,
  GripVertical,
  Image,
  MessageSquare,
  AlertCircle,
  Store,
  Calendar,
  Clock,
  Save,
  Eye
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';

interface ChecklistTemplateItem {
  id: string;
  question: string;
  description?: string;
  isRequired: boolean;
  requiresComment: boolean;
  requiresImage: boolean;
  applicableStores: string[];
  applicableDays: number[]; // 0-6 (domingo-sábado)
}

interface ChecklistTemplate {
  id?: string;
  name: string;
  description: string;
  items: ChecklistTemplateItem[];
  associatedStores: string[];
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  isActive: boolean;
}

interface ChecklistTemplateBuilderProps {
  template?: ChecklistTemplate;
  onSave: (template: ChecklistTemplate) => void;
  onCancel: () => void;
  onPreview?: (template: ChecklistTemplate) => void;
}

const ChecklistTemplateBuilder: React.FC<ChecklistTemplateBuilderProps> = ({
  template,
  onSave,
  onCancel,
  onPreview
}) => {
  const { stores } = useData();
  const [formData, setFormData] = useState<ChecklistTemplate>(
    template || {
      name: '',
      description: '',
      items: [],
      associatedStores: [],
      frequency: 'daily',
      isActive: true
    }
  );

  const daysOfWeek = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Segunda' },
    { value: 2, label: 'Terça' },
    { value: 3, label: 'Quarta' },
    { value: 4, label: 'Quinta' },
    { value: 5, label: 'Sexta' },
    { value: 6, label: 'Sábado' }
  ];

  // Template suggestions
  const templateSuggestions = [
    { name: 'Checklist de Abertura', items: ['Equipamentos ligados?', 'Limpeza inicial?', 'Produtos disponíveis?'] },
    { name: 'Checklist de Fechamento', items: ['Limpeza completa?', 'Equipamentos desligados?', 'Caixa fechado?'] },
    { name: 'Verificação de Qualidade', items: ['Produtos dentro da validade?', 'Temperatura adequada?', 'Higiene ok?'] },
    { name: 'Manutenção Semanal', items: ['Equipamentos funcionando?', 'Estoque organizado?', 'Área limpa?'] }
  ];

  const addNewItem = () => {
    const newItem: ChecklistTemplateItem = {
      id: Date.now().toString(),
      question: '',
      description: '',
      isRequired: true,
      requiresComment: false,
      requiresImage: false,
      applicableStores: ['all'],
      applicableDays: [0, 1, 2, 3, 4, 5, 6]
    };
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const removeItem = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };

  const updateItem = (itemId: string, updates: Partial<ChecklistTemplateItem>) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      )
    }));
  };

  const loadTemplate = (suggestion: typeof templateSuggestions[0]) => {
    const items: ChecklistTemplateItem[] = suggestion.items.map((question, index) => ({
      id: `${Date.now()}-${index}`,
      question,
      description: '',
      isRequired: true,
      requiresComment: false,
      requiresImage: false,
      applicableStores: ['all'],
      applicableDays: [0, 1, 2, 3, 4, 5, 6]
    }));

    setFormData(prev => ({
      ...prev,
      name: suggestion.name,
      items
    }));
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('Nome do template é obrigatório');
      return;
    }
    if (formData.items.length === 0) {
      alert('Adicione pelo menos um item ao checklist');
      return;
    }
    onSave(formData);
  };

  const handlePreview = () => {
    if (onPreview) {
      onPreview(formData);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">
            {template ? 'Editar Template' : 'Novo Template de Checklist'}
          </h2>
          <p className="text-muted-foreground">
            Configure um template que pode ser reutilizado para criar checklists
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePreview}>
            <Eye className="h-4 w-4 mr-2" />
            Visualizar
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Salvar Template
          </Button>
        </div>
      </div>

      {/* Template Suggestions */}
      {!template && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sugestões de Template</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {templateSuggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  onClick={() => loadTemplate(suggestion)}
                  className="p-4 h-auto text-left justify-start"
                >
                  <div>
                    <div className="font-semibold">{suggestion.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {suggestion.items.length} itens
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Template *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Checklist de Abertura"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequência</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, frequency: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva o propósito deste checklist..."
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
            />
            <Label htmlFor="active">Template ativo</Label>
          </div>
        </CardContent>
      </Card>

      {/* Store Association */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Lojas Aplicáveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
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
              <Label htmlFor="all-stores" className="font-medium">Todas as lojas</Label>
            </div>

            {!formData.associatedStores.includes('all') && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                {stores.map((store) => (
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
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Itens do Checklist</CardTitle>
            <Button onClick={addNewItem} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.items.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum item adicionado</h3>
              <p className="text-muted-foreground mb-4">
                Adicione itens para criar seu checklist personalizado
              </p>
              <Button onClick={addNewItem}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Item
              </Button>
            </div>
          ) : (
            formData.items.map((item, index) => (
              <Card key={item.id} className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <GripVertical className="h-5 w-5 text-muted-foreground mt-3 cursor-move" />

                    <div className="flex-1 space-y-4">
                      <div className="flex justify-between items-start">
                        <Badge variant="outline">Item {index + 1}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Pergunta *</Label>
                          <Input
                            value={item.question}
                            onChange={(e) => updateItem(item.id, { question: e.target.value })}
                            placeholder="Ex: Equipamentos estão funcionando?"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Descrição/Observação</Label>
                          <Input
                            value={item.description || ''}
                            onChange={(e) => updateItem(item.id, { description: e.target.value })}
                            placeholder="Detalhes adicionais..."
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={item.isRequired}
                            onCheckedChange={(checked) => updateItem(item.id, { isRequired: checked })}
                          />
                          <Label className="text-sm">Obrigatório</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={item.requiresComment}
                            onCheckedChange={(checked) => updateItem(item.id, { requiresComment: checked })}
                          />
                          <MessageSquare className="h-4 w-4" />
                          <Label className="text-sm">Requer comentário</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={item.requiresImage}
                            onCheckedChange={(checked) => updateItem(item.id, { requiresImage: checked })}
                          />
                          <Image className="h-4 w-4" />
                          <Label className="text-sm">Requer imagem</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          {template ? 'Atualizar Template' : 'Criar Template'}
        </Button>
      </div>
    </div>
  );
};

export default ChecklistTemplateBuilder;