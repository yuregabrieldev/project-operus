import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckSquare, History, Settings, UserCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ChecklistDashboard from './ChecklistDashboard';
import ChecklistAdminView from './ChecklistAdminView';
import ChecklistExecution from './ChecklistExecution';
import ChecklistHistory from './ChecklistHistory';

const ChecklistManager: React.FC = () => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<'dashboard' | 'admin' | 'execution' | 'history'>('dashboard');
  const [selectedChecklistId, setSelectedChecklistId] = useState<string | null>(null);
  const [shouldCreateNew, setShouldCreateNew] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'manager';

  const handleChecklistAction = (checklistId: string) => {
    setSelectedChecklistId(checklistId);
    setActiveView('execution');
  };

  const handleCreateNew = () => {
    setShouldCreateNew(true);
    setActiveView('execution');
  };

  const handleManageTemplates = () => {
    setActiveView('admin');
  };

  if ((selectedChecklistId || shouldCreateNew) && activeView === 'execution') {
    return (
      <ChecklistExecution
        checklistId={selectedChecklistId}
        createNew={shouldCreateNew}
        onComplete={() => {
          setSelectedChecklistId(null);
          setShouldCreateNew(false);
          setActiveView('dashboard');
        }}
        onCancel={() => {
          setSelectedChecklistId(null);
          setShouldCreateNew(false);
          setActiveView('dashboard');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Navigation */}
      <div className="border-b bg-card">
        <div className="p-4">
          <Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-4">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Meus Checklists</span>
                <span className="sm:hidden">Checklist</span>
              </TabsTrigger>
              
              {isAdmin && (
                <TabsTrigger value="admin" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Gerenciar</span>
                  <span className="sm:hidden">Admin</span>
                </TabsTrigger>
              )}
              
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">Histórico</span>
                <span className="sm:hidden">Histórico</span>
              </TabsTrigger>
            </TabsList>

            {/* Content */}
            <div className="mt-6">
              <TabsContent value="dashboard" className="space-y-6">
                <ChecklistDashboard 
                  onChecklistAction={handleChecklistAction}
                  onCreateNew={handleCreateNew}
                  onManageTemplates={handleManageTemplates}
                />
              </TabsContent>

              {isAdmin && (
                <TabsContent value="admin" className="space-y-6">
                  <ChecklistAdminView />
                </TabsContent>
              )}

              <TabsContent value="history" className="space-y-6">
                <ChecklistHistory />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Non-admin users trying to access admin view */}
      {!isAdmin && activeView === 'admin' && (
        <div className="p-6">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Acesso Restrito</h3>
              <p className="text-muted-foreground mb-4">
                Apenas administradores e gerentes podem acessar o gerenciamento de templates.
              </p>
              <Button onClick={() => setActiveView('dashboard')}>
                Voltar aos Meus Checklists
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ChecklistManager;