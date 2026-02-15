import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Settings, Plus, Edit, Trash2, Store, Calendar, AlertCircle } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { ChecklistTemplateForm } from './ChecklistTemplateForm';

interface ChecklistTemplate {
  id: string;
  name: string;
  type: 'opening' | 'closing' | 'quality' | 'custom';
  items: ChecklistItem[];
  associatedStores: string[];
  isActive: boolean;
  createdAt: Date;
}

interface ChecklistItem {
  id: string;
  question: string;
  description?: string;
  requiresComment: boolean;
  requiresImage: boolean;
  applicableStores: string[];
  applicableDays: number[]; // 0-6 (domingo-sábado)
  isOptional: boolean;
}

const ChecklistConfigManager: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { stores } = useData();

  const [templates, setTemplates] = useState<ChecklistTemplate[]>([
    {
      id: '1',
      name: 'Checklist Abertura',
      type: 'opening',
      items: [
        {
          id: '1-1',
          question: 'Equipamentos ligados e funcionando?',
          description: 'Verificar blender, máquina de açaí, etc.',
          requiresComment: false,
          requiresImage: false,
          applicableStores: ['all'],
          applicableDays: [0, 1, 2, 3, 4, 5, 6],
          isOptional: false
        }
      ],
      associatedStores: ['all'],
      isActive: true,
      createdAt: new Date()
    },
    {
      id: '2',
      name: 'Checklist Fechamento',
      type: 'closing',
      items: [
        {
          id: '2-1',
          question: 'Limpeza completa realizada?',
          description: 'Incluindo equipamentos e área de produção',
          requiresComment: true,
          requiresImage: true,
          applicableStores: ['all'],
          applicableDays: [0, 1, 2, 3, 4, 5, 6],
          isOptional: false
        }
      ],
      associatedStores: ['all'],
      isActive: true,
      createdAt: new Date()
    }
  ]);

  const [selectedTemplate, setSelectedTemplate] = useState<ChecklistTemplate | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  // Verificar se usuário é admin
  const isAdmin = user?.role === 'admin' || user?.role === 'manager';

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Acesso Restrito</h3>
            <p className="text-muted-foreground">
              Apenas administradores e gerentes podem configurar checklists.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCreateNew = () => {
    setSelectedTemplate(null);
    setIsFormOpen(true);
  };

  const handleEdit = (template: ChecklistTemplate) => {
    setSelectedTemplate(template);
    setIsFormOpen(true);
  };

  const handleDelete = (templateId: string) => {
    setTemplateToDelete(templateId);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (templateToDelete) {
      setTemplates(prev => prev.filter(t => t.id !== templateToDelete));
      toast({
        title: "Template removido",
        description: "Template de checklist foi removido com sucesso.",
      });
    }
    setIsDeleteConfirmOpen(false);
    setTemplateToDelete(null);
  };

  const handleSaveTemplate = (templateData: Partial<ChecklistTemplate>) => {
    if (selectedTemplate) {
      // Edit existing
      setTemplates(prev => prev.map(t =>
        t.id === selectedTemplate.id
          ? { ...t, ...templateData } as ChecklistTemplate
          : t
      ));
      toast({
        title: "Template atualizado",
        description: "Template de checklist foi atualizado com sucesso.",
      });
    } else {
      // Create new
      const newTemplate: ChecklistTemplate = {
        id: Date.now().toString(),
        createdAt: new Date(),
        isActive: true,
        ...templateData as ChecklistTemplate
      };
      setTemplates(prev => [...prev, newTemplate]);
      toast({
        title: "Template criado",
        description: "Novo template de checklist foi criado com sucesso.",
      });
    }
    setIsFormOpen(false);
  };

  const toggleTemplateStatus = (templateId: string) => {
    setTemplates(prev => prev.map(t =>
      t.id === templateId
        ? { ...t, isActive: !t.isActive }
        : t
    ));
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'opening': return 'bg-green-100 text-green-800';
      case 'closing': return 'bg-red-100 text-red-800';
      case 'quality': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'opening': return 'Abertura';
      case 'closing': return 'Fechamento';
      case 'quality': return 'Qualidade';
      default: return 'Personalizado';
    }
  };

  const getStoreNames = (storeIds: string[]) => {
    if (storeIds.includes('all')) return 'Todas as lojas';
    return storeIds
      .map(id => stores.find(s => s.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            Configuração de Checklists
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie templates de checklists e suas configurações
          </p>
        </div>

        <Button onClick={handleCreateNew} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Novo Template
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{templates.length}</p>
              </div>
              <Settings className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ativos</p>
                <p className="text-2xl font-bold text-green-600">
                  {templates.filter(t => t.isActive).length}
                </p>
              </div>
              <Store className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Abertura</p>
                <p className="text-2xl font-bold text-green-600">
                  {templates.filter(t => t.type === 'opening').length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fechamento</p>
                <p className="text-2xl font-bold text-red-600">
                  {templates.filter(t => t.type === 'closing').length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Templates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Templates de Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Lojas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(template.type)}>
                        {getTypeName(template.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>{template.items.length} itens</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {getStoreNames(template.associatedStores)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={template.isActive ? "default" : "secondary"}>
                        {template.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(template)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleTemplateStatus(template.id)}
                          className={template.isActive ? "text-orange-600" : "text-green-600"}
                        >
                          {template.isActive ? "Desativar" : "Ativar"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(template.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Template Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? 'Editar Template' : 'Novo Template'}
            </DialogTitle>
          </DialogHeader>
          <ChecklistTemplateForm
            template={selectedTemplate}
            onSave={handleSaveTemplate}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Tem certeza que deseja excluir este template? Esta ação não pode ser desfeita.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Excluir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChecklistConfigManager;