import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/ui/stats-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Clock, History, Settings, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useChecklist } from '@/contexts/ChecklistContext';
import ChecklistCard from './ChecklistCard';

interface ChecklistItem {
  id: string;
  name: string;
  storeNames: string;
  progress: {
    completed: number;
    total: number;
  };
  status: 'not_started' | 'in_progress' | 'paused' | 'completed';
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
}

interface ChecklistDashboardProps {
  onChecklistAction: (checklistId: string) => void;
  onCreateNew: () => void;
  onManageTemplates: () => void;
}

const ChecklistDashboard: React.FC<ChecklistDashboardProps> = ({
  onChecklistAction,
  onCreateNew,
  onManageTemplates
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { executions, history } = useChecklist();

  // Convert executions to ChecklistItem format
  const pendingChecklists: ChecklistItem[] = executions.map(execution => ({
    id: execution.id,
    name: execution.templateName,
    storeNames: 'Loja', // Would come from store context
    progress: {
      completed: execution.responses.filter(r => r.response !== null || r.skipped).length,
      total: execution.responses.length
    },
    status: execution.status === 'draft' ? 'paused' : execution.status,
    startedAt: execution.startTime,
    completedAt: execution.endTime,
    duration: execution.endTime ? Math.round((execution.endTime.getTime() - execution.startTime.getTime()) / 60000) : undefined
  }));

  // Convert history to ChecklistItem format
  const historyChecklists: ChecklistItem[] = history.slice(0, 10).map(item => ({
    id: item.id,
    name: item.templateName,
    storeNames: item.storeName,
    progress: { completed: item.completedItems, total: item.totalItems },
    status: 'completed',
    completedAt: item.endTime,
    duration: item.duration
  }));

  const handleChecklistAction = (id: string) => {
    onChecklistAction(id);
  };

  const handleManageTemplates = () => {
    onManageTemplates();
  };

  const handleCreateNew = () => {
    onCreateNew();
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'manager';

  const incompleteTasks = pendingChecklists.filter(c => c.status === 'in_progress' || c.status === 'paused');
  const notStartedTasks = pendingChecklists.filter(c => c.status === 'not_started');

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Pendentes"
          value={pendingChecklists.length}
          icon={Clock}
          variant="default"
        />

        <StatsCard
          title="Em Progresso"
          value={incompleteTasks.length}
          icon={CheckCircle}
          variant="warning"
        />

        <StatsCard
          title="Completos Hoje"
          value={historyChecklists.filter(c =>
            c.completedAt &&
            c.completedAt.toDateString() === new Date().toDateString()
          ).length}
          icon={History}
          variant="success"
        />
      </div>

      {/* Main Content Actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Checklists Pendentes</h2>
        {isAdmin && (
          <Button onClick={handleCreateNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Checklist
          </Button>
        )}
      </div>

      {/* Incomplete Tasks */}
      {incompleteTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600 text-base">
              <Clock className="h-5 w-5" />
              Em Andamento
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 ml-auto">{incompleteTasks.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {incompleteTasks.map((checklist) => (
              <ChecklistCard
                key={checklist.id}
                {...checklist}
                onAction={handleChecklistAction}
                variant="pending"
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Not Started Tasks */}
      {notStartedTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground text-base">
              <CheckCircle className="h-5 w-5 text-primary" />
              Disponíveis
              <Badge variant="secondary" className="ml-auto">{notStartedTasks.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {notStartedTasks.map((checklist) => (
              <ChecklistCard
                key={checklist.id}
                {...checklist}
                onAction={handleChecklistAction}
                variant="pending"
              />
            ))}
          </CardContent>
        </Card>
      )}

      {pendingChecklists.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">Tudo em dia!</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Você completou todos os checklists pendentes. Aproveite o dia!
            </p>
            {isAdmin && (
              <Button onClick={handleCreateNew} variant="outline" className="mt-6 gap-2">
                <Plus className="h-4 w-4" />
                Iniciar Novo Checklist
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ChecklistDashboard;