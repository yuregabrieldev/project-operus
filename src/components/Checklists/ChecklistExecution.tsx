import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, Save, ChevronLeft, ChevronRight, CheckCircle, Clock, Upload, Wifi, WifiOff } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useChecklist } from '@/contexts/ChecklistContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';

interface ChecklistExecution {
  id: string;
  templateId: string;
  templateName: string;
  storeId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  status: 'draft' | 'in_progress' | 'completed';
  responses: ChecklistResponse[];
  currentItemIndex: number;
}

interface ChecklistResponse {
  itemId: string;
  question?: string;
  response: boolean | null;
  comment?: string;
  imageUrl?: string;
  skipped: boolean;
  completedAt?: Date;
}

interface ChecklistItem {
  id: string;
  question: string;
  description?: string;
  requiresComment: boolean;
  requiresImage: boolean;
  isOptional: boolean;
}

interface ChecklistExecutionProps {
  checklistId?: string | null;
  createNew?: boolean;
  onComplete?: () => void;
  onCancel?: () => void;
}

const ChecklistExecution: React.FC<ChecklistExecutionProps> = ({
  checklistId,
  createNew = false,
  onComplete,
  onCancel
}) => {
  const { stores } = useData();
  const { user } = useAuth();
  const {
    templates,
    executions,
    addExecution,
    updateExecution,
    deleteExecution,
    addToHistory,
    getTemplateById,
    getExecutionById
  } = useChecklist();
  const { t } = useLanguage();

  const [selectedStore, setSelectedStore] = useState<string>('');
  const [currentExecution, setCurrentExecution] = useState<ChecklistExecution | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncQueue, setSyncQueue] = useState<ChecklistExecution[]>([]);

  // Load data and setup on mount
  useEffect(() => {
    // If checklistId is provided, try to resume that checklist
    if (checklistId && !createNew) {
      const existingExecution = getExecutionById(checklistId);
      if (existingExecution) {
        setCurrentExecution(existingExecution);
      }
    }

    // Online/offline detection
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checklistId, createNew, getExecutionById]);

  // Auto-sync when online
  useEffect(() => {
    if (isOnline && syncQueue.length > 0) {
      syncToServer();
    }
  }, [isOnline, syncQueue]);

  const startChecklist = (templateId: string) => {
    if (!selectedStore) {
      toast({
        title: t('checklists.error'),
        description: t('checklists.selectStoreFirst'),
        variant: "destructive"
      });
      return;
    }

    const template = getTemplateById(templateId);
    if (!template) return;

    const newExecution = addExecution({
      templateId,
      templateName: template.name,
      storeId: selectedStore,
      userId: user?.id || 'unknown',
      startTime: new Date(),
      status: 'in_progress',
      currentItemIndex: 0,
      responses: template.items.map(item => ({
        itemId: item.id,
        question: item.question,
        response: null,
        skipped: false
      }))
    });

    setCurrentExecution(newExecution);
  };

  const getCurrentTemplate = () => {
    if (!currentExecution) return null;
    return getTemplateById(currentExecution.templateId) || null;
  };

  const getCurrentItem = (): ChecklistItem | null => {
    const template = getCurrentTemplate();
    if (!template || !currentExecution) return null;
    const templateItem = template.items[currentExecution.currentItemIndex];
    if (!templateItem) return null;

    // Convert ChecklistTemplateItem to ChecklistItem
    return {
      id: templateItem.id,
      question: templateItem.question,
      description: templateItem.description,
      requiresComment: templateItem.requiresComment,
      requiresImage: templateItem.requiresImage,
      isOptional: !templateItem.isRequired // Convert isRequired to isOptional
    };
  };

  const updateResponse = (updates: Partial<ChecklistResponse>) => {
    if (!currentExecution) return;

    const newExecution = {
      ...currentExecution,
      responses: currentExecution.responses.map((response, index) =>
        index === currentExecution.currentItemIndex
          ? { ...response, ...updates, completedAt: new Date() }
          : response
      )
    };

    setCurrentExecution(newExecution);
  };

  const canProceed = (): boolean => {
    if (!currentExecution) return false;

    const currentResponse = currentExecution.responses[currentExecution.currentItemIndex];
    const currentItem = getCurrentItem();

    if (!currentItem || currentResponse.skipped) return true;

    // Check if response is given
    if (currentResponse.response === null) return false;

    // Check required fields
    if (currentItem.requiresComment && !currentResponse.comment?.trim()) return false;
    if (currentItem.requiresImage && !currentResponse.imageUrl) return false;

    return true;
  };

  const nextItem = () => {
    if (!currentExecution || !canProceed()) return;

    const template = getCurrentTemplate();
    if (!template) return;

    if (currentExecution.currentItemIndex < template.items.length - 1) {
      const newExecution = {
        ...currentExecution,
        currentItemIndex: currentExecution.currentItemIndex + 1
      };
      setCurrentExecution(newExecution);
      updateExecution(newExecution.id, newExecution);
    } else {
      completeChecklist();
    }
  };

  const previousItem = () => {
    if (!currentExecution || currentExecution.currentItemIndex === 0) return;

    const newExecution = {
      ...currentExecution,
      currentItemIndex: currentExecution.currentItemIndex - 1
    };
    setCurrentExecution(newExecution);
    updateExecution(newExecution.id, newExecution);
  };

  const skipItem = () => {
    if (!currentExecution) return;

    const currentItem = getCurrentItem();
    if (!currentItem || !currentItem.isOptional) {
      toast({
        title: t('checklists.requiredItem'),
        description: t('checklists.cannotSkip'),
        variant: "destructive"
      });
      return;
    }

    updateResponse({ skipped: true });
    setTimeout(nextItem, 100);
  };

  const saveAsDraft = () => {
    if (!currentExecution) return;

    const newExecution = { ...currentExecution, status: 'draft' as const };
    updateExecution(newExecution.id, newExecution);
    setCurrentExecution(null);

    toast({
      title: t('checklists.draftSaved'),
      description: t('checklists.draftSavedDesc'),
    });

    // Call onCancel callback to go back
    if (onCancel) {
      onCancel();
    }
  };

  const completeChecklist = () => {
    if (!currentExecution) return;

    const completedExecution = {
      ...currentExecution,
      status: 'completed' as const,
      endTime: new Date()
    };

    // Get store and user names for history
    const storeName = stores.find(s => s.id === currentExecution.storeId)?.name || 'Loja desconhecida';
    const userName = user?.name || user?.email || 'Usuário desconhecido';

    // Add to history and remove from executions
    addToHistory(completedExecution, storeName, userName);
    deleteExecution(completedExecution.id);
    setCurrentExecution(null);

    toast({
      title: t('checklists.checklistCompleted'),
      description: `${completedExecution.templateName} ${t('checklists.checklistCompletedDesc')}`,
    });

    // Call onComplete callback
    if (onComplete) {
      onComplete();
    }
  };

  const resumeChecklist = (execution: ChecklistExecution) => {
    setCurrentExecution({ ...execution, status: 'in_progress' });
  };


  const syncToServer = async () => {
    // Mock sync - em produção faria POST para API
    // syncQueue processed

    // Simular sucesso
    setTimeout(() => {
      setSyncQueue([]);
      toast({
        title: t('checklists.syncCompleted'),
        description: `${syncQueue.length} ${t('checklists.syncCompletedDesc')}`,
      });
    }, 2000);
  };

  const handleImageUpload = (file: File) => {
    // Mock upload - em produção faria upload real
    const mockUrl = URL.createObjectURL(file);
    updateResponse({ imageUrl: mockUrl });
  };

  const getProgress = (): number => {
    if (!currentExecution) return 0;
    const template = getCurrentTemplate();
    if (!template) return 0;

    const completedItems = currentExecution.responses.filter(r =>
      r.response !== null || r.skipped
    ).length;

    return Math.round((completedItems / template.items.length) * 100);
  };

  // Render execution screen
  if (currentExecution) {
    const template = getCurrentTemplate();
    const currentItem = getCurrentItem();
    const currentResponse = currentExecution.responses[currentExecution.currentItemIndex];
    const progress = getProgress();

    if (!template || !currentItem) return null;

    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{template.name}</h1>
            <p className="text-muted-foreground">
              {stores.find(s => s.id === currentExecution.storeId)?.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isOnline && <WifiOff className="h-5 w-5 text-orange-500" />}
            {isOnline && <Wifi className="h-5 w-5 text-green-500" />}
          </div>
        </div>

        {/* Progress */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t('checklists.itemOf')} {currentExecution.currentItemIndex + 1} {t('checklists.of')} {template.items.length}</span>
                <span>{progress}% {t('checklists.completed')}</span>
              </div>
              <Progress value={progress} />
            </div>
          </CardContent>
        </Card>

        {/* Current Item */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{currentItem.question}</CardTitle>
            {currentItem.description && (
              <p className="text-muted-foreground">{currentItem.description}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Response */}
            <div>
              <Label className="text-base">{t('checklists.response')}</Label>
              <div className="flex gap-4 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={currentResponse.response === true}
                    onCheckedChange={() => updateResponse({ response: true })}
                  />
                  <Label>{t('checklists.yesOk')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={currentResponse.response === false}
                    onCheckedChange={() => updateResponse({ response: false })}
                  />
                  <Label>{t('checklists.noProblem')}</Label>
                </div>
              </div>
            </div>

            {/* Comment */}
            {currentItem.requiresComment && (
              <div>
                <Label>{t('checklists.commentRequired')}</Label>
                <Textarea
                  value={currentResponse.comment || ''}
                  onChange={(e) => updateResponse({ comment: e.target.value })}
                  placeholder={t('checklists.commentPlaceholder')}
                  rows={3}
                />
              </div>
            )}

            {/* Image Upload */}
            {currentItem.requiresImage && (
              <div>
                <Label>{t('checklists.imageRequired')}</Label>
                <div className="mt-2">
                  {currentResponse.imageUrl ? (
                    <div className="space-y-2">
                      <img
                        src={currentResponse.imageUrl}
                        alt="Evidência"
                        className="w-full max-w-xs rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => updateResponse({ imageUrl: undefined })}
                      >
                        {t('checklists.changeImage')}
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-4">
                        {t('checklists.addPhoto')}
                      </p>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file);
                        }}
                        className="hidden"
                        id="image-upload"
                      />
                      <Label htmlFor="image-upload" className="cursor-pointer">
                        <Button type="button" asChild>
                          <span>
                            <Upload className="h-4 w-4 mr-2" />
                            {t('checklists.chooseFile')}
                          </span>
                        </Button>
                      </Label>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between">
          <div className="space-x-2">
            <Button variant="outline" onClick={onCancel}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              {t('checklists.back')}
            </Button>

            <Button
              variant="outline"
              onClick={previousItem}
              disabled={currentExecution.currentItemIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              {t('checklists.previous')}
            </Button>

            {currentItem && !currentItem.isOptional && (
              <Button variant="outline" onClick={skipItem}>
                {t('checklists.skip')}
              </Button>
            )}
          </div>

          <div className="space-x-2">
            <Button variant="outline" onClick={saveAsDraft}>
              <Save className="h-4 w-4 mr-2" />
              {t('checklists.saveDraft')}
            </Button>

            <Button
              onClick={nextItem}
              disabled={!canProceed()}
              className={currentExecution.currentItemIndex === template.items.length - 1 ?
                "bg-green-600 hover:bg-green-700" : ""
              }
            >
              {currentExecution.currentItemIndex === template.items.length - 1 ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {t('checklists.finish')}
                </>
              ) : (
                <>
                  {t('checklists.next')}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Render main screen (template selection if createNew is true)
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {createNew ? t('checklists.newChecklistTitle') : t('checklists.pendingTitle')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {createNew ? t('checklists.selectTemplateDesc') : t('checklists.pendingDesc')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            {t('checklists.back')}
          </Button>
          {!isOnline && (
            <Badge variant="outline" className="text-orange-600">
              <WifiOff className="h-3 w-3 mr-1" />
              Offline
            </Badge>
          )}
          {syncQueue.length > 0 && (
            <Badge variant="outline" className="text-blue-600">
              {syncQueue.length} {t('checklists.toSync')}
            </Badge>
          )}
        </div>
      </div>

      {/* Store Selection */}
      <Card>
        <CardHeader>
          <CardTitle>{t('checklists.selectStore')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedStore} onValueChange={setSelectedStore}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('checklists.choosePlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {stores.map(store => (
                <SelectItem key={store.id} value={store.id}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Available Templates */}
      <Card>
        <CardHeader>
          <CardTitle>{t('checklists.availableChecklists')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map(template => (
              <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">{template.name}</h3>
                    <Badge className={
                      template.type === 'opening' ? 'bg-green-100 text-green-800' :
                        template.type === 'closing' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                    }>
                      {template.type === 'opening' ? t('checklists.opening') :
                        template.type === 'closing' ? t('checklists.closing') : t('checklists.quality')}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {template.items.length} {t('checklists.itemsToCheck')}
                  </p>
                  <Button
                    onClick={() => startChecklist(template.id)}
                    disabled={!selectedStore}
                    className="w-full"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    {t('checklists.startChecklist')}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Checklists */}
      {executions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('checklists.savedDrafts')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {executions.map(execution => (
                <div key={execution.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{execution.templateName}</h4>
                    <p className="text-sm text-muted-foreground">
                      {stores.find(s => s.id === execution.storeId)?.name} •
                      {t('checklists.startedAt')} {new Date(execution.startTime).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => resumeChecklist(execution)}>
                    {t('checklists.continue')}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ChecklistExecution;