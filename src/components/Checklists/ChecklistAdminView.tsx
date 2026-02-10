import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Settings, 
  Plus, 
  Search, 
  Edit, 
  Copy, 
  Trash2, 
  Eye,
  Filter,
  MoreHorizontal,
  Calendar,
  Store,
  CheckSquare
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { toast } from '@/hooks/use-toast';
import ChecklistTemplateBuilder from './ChecklistTemplateBuilder';

interface ChecklistTemplate {
  id: string;
  name: string;
  description: string;
  itemsCount: number;
  associatedStores: string[];
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  isActive: boolean;
  lastEditedAt: Date;
  createdAt: Date;
  usageCount: number;
}

const ChecklistAdminView: React.FC = () => {
  const { user } = useAuth();
  const { stores } = useData();
  
  // Mock data - replace with real data
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([
    {
      id: '1',
      name: 'Verificação Mensal',
      description: 'Checklist completo de verificação mensal das operações',
      itemsCount: 5,
      associatedStores: ['all'],
      frequency: 'monthly',
      isActive: true,
      lastEditedAt: new Date(2024, 6, 10),
      createdAt: new Date(2024, 5, 1),
      usageCount: 12
    },
    {
      id: '2',
      name: 'Checklist Diário',
      description: 'Verificações básicas diárias',
      itemsCount: 3,
      associatedStores: ['1', '2'],
      frequency: 'daily',
      isActive: true,
      lastEditedAt: new Date(2024, 6, 5),
      createdAt: new Date(2024, 5, 15),
      usageCount: 45
    },
    {
      id: '3',
      name: 'Limpeza Semanal',
      description: 'Protocolo de limpeza profunda semanal',
      itemsCount: 8,
      associatedStores: ['1'],
      frequency: 'weekly',
      isActive: false,
      lastEditedAt: new Date(2024, 6, 1),
      createdAt: new Date(2024, 4, 20),
      usageCount: 8
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ChecklistTemplate | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeTemplates = templates.filter(t => t.isActive).length;
  const totalUsage = templates.reduce((sum, t) => sum + t.usageCount, 0);

  const handleCreateNew = () => {
    setSelectedTemplate(null);
    setIsBuilderOpen(true);
  };

  const handleEdit = (template: ChecklistTemplate) => {
    setSelectedTemplate(template);
    setIsBuilderOpen(true);
  };

  const handleDuplicate = (template: ChecklistTemplate) => {
    const duplicated = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (Cópia)`,
      createdAt: new Date(),
      lastEditedAt: new Date(),
      usageCount: 0
    };
    setTemplates(prev => [...prev, duplicated]);
    toast({
      title: "Template duplicado",
      description: "Uma cópia do template foi criada com sucesso.",
    });
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
        description: "Template foi removido com sucesso.",
      });
    }
    setIsDeleteConfirmOpen(false);
    setTemplateToDelete(null);
  };

  const handleSaveTemplate = (templateData: any) => {
    if (selectedTemplate) {
      // Edit existing
      setTemplates(prev => prev.map(t => 
        t.id === selectedTemplate.id 
          ? { 
              ...t, 
              ...templateData, 
              lastEditedAt: new Date(),
              itemsCount: templateData.items?.length || t.itemsCount
            }
          : t
      ));
      toast({
        title: "Template atualizado",
        description: "Template foi atualizado com sucesso.",
      });
    } else {
      // Create new
      const newTemplate: ChecklistTemplate = {
        id: Date.now().toString(),
        name: templateData.name,
        description: templateData.description,
        itemsCount: templateData.items?.length || 0,
        associatedStores: templateData.associatedStores,
        frequency: templateData.frequency,
        isActive: templateData.isActive,
        createdAt: new Date(),
        lastEditedAt: new Date(),
        usageCount: 0
      };
      setTemplates(prev => [...prev, newTemplate]);
      toast({
        title: "Template criado",
        description: "Novo template foi criado com sucesso.",
      });
    }
    setIsBuilderOpen(false);
  };

  const toggleTemplateStatus = (templateId: string) => {
    setTemplates(prev => prev.map(t => 
      t.id === templateId 
        ? { ...t, isActive: !t.isActive, lastEditedAt: new Date() }
        : t
    ));
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'Diário';
      case 'weekly': return 'Semanal';
      case 'monthly': return 'Mensal';
      default: return 'Personalizado';
    }
  };

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'bg-blue-100 text-blue-800';
      case 'weekly': return 'bg-green-100 text-green-800';
      case 'monthly': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStoreNames = (storeIds: string[]) => {
    if (storeIds.includes('all')) return 'Todas as lojas';
    return storeIds
      .map(id => stores.find(s => s.id === id)?.name)
      .filter(Boolean)
      .join(', ') || 'Nenhuma loja';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8 text-primary" />
            Gerenciar Templates de Checklist
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure e gerencie templates reutilizáveis para checklists
          </p>
        </div>
        
        <Button onClick={handleCreateNew} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Novo Template
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{templates.length}</p>
              </div>
              <CheckSquare className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ativos</p>
                <p className="text-2xl font-bold text-green-600">{activeTemplates}</p>
              </div>
              <Store className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Uso Total</p>
                <p className="text-2xl font-bold text-blue-600">{totalUsage}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Mais Usado</p>
                <p className="text-lg font-bold text-purple-600">
                  {templates.reduce((max, t) => t.usageCount > max.usageCount ? t : max, templates[0])?.name || 'N/A'}
                </p>
              </div>
              <Eye className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Templates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Templates ({filteredTemplates.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Frequência</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Lojas</TableHead>
                  <TableHead>Uso</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Última Edição</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{template.name}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {template.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getFrequencyColor(template.frequency)}>
                        {getFrequencyLabel(template.frequency)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{template.itemsCount}</span> itens
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">
                      {getStoreNames(template.associatedStores)}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{template.usageCount}</span>x
                    </TableCell>
                    <TableCell>
                      <Badge variant={template.isActive ? "default" : "secondary"}>
                        {template.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {template.lastEditedAt.toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(template)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleTemplateStatus(template.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            {template.isActive ? 'Desativar' : 'Ativar'}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(template.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-8">
              <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum template encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Tente ajustar sua busca' : 'Crie seu primeiro template de checklist'}
              </p>
              {!searchTerm && (
                <Button onClick={handleCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Template
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Template Builder Dialog */}
      <Dialog open={isBuilderOpen} onOpenChange={setIsBuilderOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? 'Editar Template' : 'Novo Template'}
            </DialogTitle>
          </DialogHeader>
          <ChecklistTemplateBuilder
            template={selectedTemplate ? {
              id: selectedTemplate.id,
              name: selectedTemplate.name,
              description: selectedTemplate.description,
              items: [], // Would load from API
              associatedStores: selectedTemplate.associatedStores,
              frequency: selectedTemplate.frequency,
              isActive: selectedTemplate.isActive
            } : undefined}
            onSave={handleSaveTemplate}
            onCancel={() => setIsBuilderOpen(false)}
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

export default ChecklistAdminView;