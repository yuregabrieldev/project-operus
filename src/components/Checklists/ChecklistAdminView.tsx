import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/ui/stats-card';
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
  CheckCircle
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useLanguage } from '@/contexts/LanguageContext';
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
  const { t } = useLanguage();

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
      name: `${template.name} (${t('checklists.copy')})`,
      createdAt: new Date(),
      lastEditedAt: new Date(),
      usageCount: 0
    };
    setTemplates(prev => [...prev, duplicated]);
    toast({
      title: t('checklists.templateDuplicated'),
      description: t('checklists.templateDuplicatedDesc'),
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
        title: t('checklists.templateRemoved'),
        description: t('checklists.templateRemovedDesc'),
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
        title: t('checklists.templateUpdated'),
        description: t('checklists.templateUpdatedDesc'),
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
        title: t('checklists.templateCreated'),
        description: t('checklists.templateCreatedDesc'),
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
      case 'daily': return t('checklists.daily');
      case 'weekly': return t('checklists.weekly');
      case 'monthly': return t('checklists.monthly');
      default: return t('checklists.custom');
    }
  };

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'weekly': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'monthly': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStoreNames = (storeIds: string[]) => {
    if (storeIds.includes('all')) return t('checklists.allStores');
    return storeIds
      .map(id => stores.find(s => s.id === id)?.name)
      .filter(Boolean)
      .join(', ') || t('checklists.noStores');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title={t('checklists.total')}
          value={templates.length}
          icon={CheckCircle}
          variant="purple"
          valueClassName="text-2xl"
        />

        <StatsCard
          title={t('checklists.active')}
          value={activeTemplates}
          icon={Store}
          variant="success"
          valueClassName="text-2xl"
        />

        <StatsCard
          title={t('checklists.totalUsage')}
          value={totalUsage}
          icon={Calendar}
          variant="default"
          valueClassName="text-2xl"
        />

        <StatsCard
          title={t('checklists.mostUsed')}
          value={templates.reduce((max, t) => t.usageCount > max.usageCount ? t : max, templates[0])?.name || 'N/A'}
          icon={Eye}
          variant="purple"
          className="col-span-1"
          valueClassName="text-xl truncate"
        />
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={t('checklists.searchTemplates')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                {t('checklists.filters')}
              </Button>
              <Button onClick={handleCreateNew} className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                {t('checklists.newTemplate')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('checklists.templates')} ({filteredTemplates.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('checklists.name')}</TableHead>
                  <TableHead>{t('checklists.frequency')}</TableHead>
                  <TableHead>{t('checklists.items')}</TableHead>
                  <TableHead>{t('checklists.stores')}</TableHead>
                  <TableHead>{t('checklists.usage')}</TableHead>
                  <TableHead>{t('checklists.status')}</TableHead>
                  <TableHead>{t('checklists.lastEdit')}</TableHead>
                  <TableHead className="w-[100px]">{t('checklists.actions')}</TableHead>
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
                      <span className="font-medium">{template.itemsCount}</span> {t('checklists.itemsCount')}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">
                      {getStoreNames(template.associatedStores)}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{template.usageCount}</span>x
                    </TableCell>
                    <TableCell>
                      <Badge variant={template.isActive ? "default" : "secondary"}>
                        {template.isActive ? t('checklists.activeStatus') : t('checklists.inactiveStatus')}
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
                            {t('checklists.edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                            <Copy className="h-4 w-4 mr-2" />
                            {t('checklists.duplicate')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleTemplateStatus(template.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            {template.isActive ? t('checklists.deactivate') : t('checklists.activate')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(template.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t('checklists.delete')}
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
              <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('checklists.noTemplateFound')}</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? t('checklists.adjustSearch') : t('checklists.createFirstTemplate')}
              </p>
              {!searchTerm && (
                <Button onClick={handleCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('checklists.createTemplate')}
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
              {selectedTemplate ? t('checklists.editTemplate') : t('checklists.newTemplate')}
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
            <DialogTitle>{t('checklists.confirmDelete')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>{t('checklists.confirmDeleteDesc')}</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>
                {t('checklists.cancel')}
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                {t('checklists.delete')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChecklistAdminView;