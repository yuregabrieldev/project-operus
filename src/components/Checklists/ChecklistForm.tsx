import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useData } from '@/contexts/DataContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';

interface ChecklistFormProps {
  checklist?: any;
  onClose: () => void;
}

const DEFAULT_TASKS = {
  opening: [
    { taskName: 'Ligar luzes da loja', isCompleted: false },
    { taskName: 'Abrir caixa registradora', isCompleted: false },
    { taskName: 'Verificar produtos em destaque', isCompleted: false },
    { taskName: 'Conferir limpeza do ambiente', isCompleted: false },
    { taskName: 'Organizar entrada da loja', isCompleted: false },
    { taskName: 'Verificar sistemas (computador, internet)', isCompleted: false }
  ],
  closing: [
    { taskName: 'Fechar caixa registradora', isCompleted: false },
    { taskName: 'Contar dinheiro em espécie', isCompleted: false },
    { taskName: 'Conferir estoque crítico', isCompleted: false },
    { taskName: 'Limpar balcões e vitrines', isCompleted: false },
    { taskName: 'Desligar luzes e equipamentos', isCompleted: false },
    { taskName: 'Trancar portas e ativar alarme', isCompleted: false }
  ],
  quality: [
    { taskName: 'Verificar prazo de validade dos produtos', isCompleted: false },
    { taskName: 'Conferir preços e etiquetas', isCompleted: false },
    { taskName: 'Organizar produtos nas prateleiras', isCompleted: false },
    { taskName: 'Limpar áreas de atendimento', isCompleted: false },
    { taskName: 'Verificar funcionamento dos equipamentos', isCompleted: false },
    { taskName: 'Conferir estoque versus sistema', isCompleted: false }
  ]
};

export const ChecklistForm: React.FC<ChecklistFormProps> = ({ checklist, onClose }) => {
  const { t } = useLanguage();
  const { stores, addChecklist, updateChecklist } = useData();

  const [formData, setFormData] = useState({
    storeId: '',
    type: 'opening' as 'opening' | 'closing' | 'quality',
    tasks: [] as Array<{ id?: string; taskName: string; isCompleted: boolean }>
  });

  useEffect(() => {
    if (checklist && checklist.id) {
      setFormData({
        storeId: checklist.storeId,
        type: checklist.type,
        tasks: checklist.tasks.map((task: any) => ({
          id: task.id,
          taskName: task.taskName,
          isCompleted: task.isCompleted
        }))
      });
    } else if (checklist && checklist.type) {
      setFormData({
        storeId: '',
        type: checklist.type,
        tasks: DEFAULT_TASKS[checklist.type as keyof typeof DEFAULT_TASKS].map((task, index) => ({
          id: `task-${index}`,
          ...task
        }))
      });
    } else {
      setFormData({
        storeId: '',
        type: 'opening',
        tasks: DEFAULT_TASKS.opening.map((task, index) => ({
          id: `task-${index}`,
          ...task
        }))
      });
    }
  }, [checklist]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const checklistData = {
      storeId: formData.storeId,
      type: formData.type,
      tasks: formData.tasks.map(task => ({
        id: task.id || Math.random().toString(36).substr(2, 9),
        taskName: task.taskName,
        isCompleted: task.isCompleted
      }))
    };

    if (checklist && checklist.id) {
      updateChecklist(checklist.id, checklistData);
      toast({
        title: t('checklists.updated'),
        description: t('checklists.checklist_updated_successfully'),
      });
    } else {
      addChecklist(checklistData);
      toast({
        title: t('checklists.created'),
        description: t('checklists.checklist_created_successfully'),
      });
    }

    onClose();
  };

  const handleChange = (field: string, value: string) => {
    if (field === 'type') {
      const newTasks = DEFAULT_TASKS[value as keyof typeof DEFAULT_TASKS].map((task, index) => ({
        id: `task-${index}`,
        ...task
      }));
      setFormData(prev => ({ ...prev, type: value as 'opening' | 'closing' | 'quality', tasks: newTasks }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleTaskToggle = (taskId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.map(task =>
        task.id === taskId ? { ...task, isCompleted: checked } : task
      )
    }));
  };

  const handleTaskNameChange = (taskId: string, newName: string) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.map(task =>
        task.id === taskId ? { ...task, taskName: newName } : task
      )
    }));
  };

  const addNewTask = () => {
    const newTask = {
      id: `task-${Date.now()}`,
      taskName: '',
      isCompleted: false
    };
    setFormData(prev => ({
      ...prev,
      tasks: [...prev.tasks, newTask]
    }));
  };

  const removeTask = (taskId: string) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.filter(task => task.id !== taskId)
    }));
  };

  const getCompletionRate = () => {
    const completedTasks = formData.tasks.filter(task => task.isCompleted).length;
    return Math.round((completedTasks / formData.tasks.length) * 100);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'opening': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'closing': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'quality': return 'bg-primary/10 text-primary border-primary/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header Info */}
      {checklist && checklist.id && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge className={getTypeColor(checklist.type)}>
                  {t(`checklists.${checklist.type}`)}
                </Badge>
                <span>{t('checklists.completion')}: {getCompletionRate()}%</span>
              </div>
              {checklist.completedAt && (
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                  {t('checklists.completed')}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          {checklist.completedAt && (
            <CardContent className="pt-0">
              <div className="text-sm text-muted-foreground">
                <p><strong>{t('checklists.completed_at')}:</strong> {new Date(checklist.completedAt).toLocaleString('pt-BR')}</p>
                {checklist.completedBy && (
                  <p><strong>{t('checklists.completed_by')}:</strong> {checklist.completedBy}</p>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {t('common.store')}
          </label>
          <select
            value={formData.storeId}
            onChange={(e) => handleChange('storeId', e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
            required
            disabled={!!(checklist && checklist.id)}
          >
            <option value="">{t('common.select_store')}</option>
            {stores.map(store => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {t('common.type')}
          </label>
          <select
            value={formData.type}
            onChange={(e) => handleChange('type', e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
            disabled={!!(checklist && checklist.id)}
          >
            <option value="opening">{t('checklists.opening')}</option>
            <option value="closing">{t('checklists.closing')}</option>
            <option value="quality">{t('checklists.quality')}</option>
          </select>
        </div>
      </div>

      {/* Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {t('checklists.tasks')} ({formData.tasks.filter(t => t.isCompleted).length}/{formData.tasks.length})
            {!checklist?.completedAt && (
              <Button type="button" size="sm" variant="outline" onClick={addNewTask}>
                {t('checklists.add_task')}
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {formData.tasks.map((task, index) => (
            <div key={task.id} className="flex items-center gap-3 p-3 border border-border rounded-lg bg-card">
              <Checkbox
                checked={task.isCompleted}
                onCheckedChange={(checked) => handleTaskToggle(task.id!, !!checked)}
                disabled={!!(checklist?.completedAt)}
              />
              <input
                type="text"
                value={task.taskName}
                onChange={(e) => handleTaskNameChange(task.id!, e.target.value)}
                className={`flex-1 px-2 py-1 border-0 bg-transparent focus:outline-none text-foreground ${task.isCompleted ? 'line-through text-muted-foreground' : ''
                  }`}
                placeholder={t('checklists.task_name')}
                required
                disabled={!!(checklist?.completedAt)}
              />
              {!checklist?.completedAt && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => removeTask(task.id!)}
                  className="text-destructive hover:bg-destructive/10"
                >
                  ×
                </Button>
              )}
            </div>
          ))}

          {formData.tasks.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              {t('checklists.no_tasks')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Bar */}
      {formData.tasks.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{t('checklists.progress')}</span>
              <span className="text-sm font-bold">{getCompletionRate()}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${getCompletionRate() === 100 ? 'bg-emerald-500' :
                  getCompletionRate() >= 75 ? 'bg-primary' :
                    getCompletionRate() >= 50 ? 'bg-amber-500' : 'bg-destructive'
                  }`}
                style={{ width: `${getCompletionRate()}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onClose}>
          {checklist && checklist.id ? t('common.close') : t('common.cancel')}
        </Button>
        {(!checklist?.completedAt) && (
          <Button type="submit">
            {checklist && checklist.id ? t('common.update') : t('common.create')}
          </Button>
        )}
      </div>
    </form>
  );
};
