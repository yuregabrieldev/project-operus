import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckSquare, Clock, History, Settings, Plus } from 'lucide-react';
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CheckSquare className="h-8 w-8 text-primary" />
            Meus Checklists
          </h1>
          <p className="text-muted-foreground mt-2">
            Olá, {user?.name}! Gerencie seus checklists aqui.
          </p>
        </div>

        {isAdmin && (
          <div className="flex gap-2">
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Checklist
            </Button>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-blue-600">{pendingChecklists.length}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Em Progresso</p>
                <p className="text-2xl font-bold text-yellow-600">{incompleteTasks.length}</p>
              </div>
              <CheckSquare className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completos Hoje</p>
                <p className="text-2xl font-bold text-green-600">
                  {historyChecklists.filter(c =>
                    c.completedAt &&
                    c.completedAt.toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
              <History className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            Pendentes
            {pendingChecklists.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {pendingChecklists.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Histórico
            {historyChecklists.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {historyChecklists.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-6">
          {/* Incomplete Tasks */}
          {incompleteTasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  Checklists Incompletos
                  <Badge variant="secondary">{incompleteTasks.length}</Badge>
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
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-blue-600" />
                  Checklists Não Iniciados
                  <Badge variant="secondary">{notStartedTasks.length}</Badge>
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
            <Card>
              <CardContent className="p-8 text-center">
                <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum checklist pendente</h3>
                <p className="text-muted-foreground">
                  Todos os seus checklists estão em dia!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-green-600" />
                Histórico de Checklists
                <Badge variant="secondary">{historyChecklists.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {historyChecklists.map((checklist) => (
                <ChecklistCard
                  key={checklist.id}
                  {...checklist}
                  onAction={handleChecklistAction}
                  variant="history"
                />
              ))}
              {historyChecklists.length === 0 && (
                <div className="text-center py-8">
                  <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum histórico</h3>
                  <p className="text-muted-foreground">
                    Complete alguns checklists para ver o histórico aqui.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChecklistDashboard;