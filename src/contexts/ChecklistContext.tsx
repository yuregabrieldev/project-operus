import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { useBrand } from './BrandContext';
import { checklistService } from '@/lib/supabase-services';

// Interfaces (unchanged for backward compat)
export interface ChecklistTemplate {
  id: string;
  name: string;
  description: string;
  type: 'opening' | 'closing' | 'quality' | 'maintenance';
  items: ChecklistTemplateItem[];
  associatedStores: string[];
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  isActive: boolean;
  createdAt: Date;
  lastEditedAt: Date;
  usageCount: number;
}

export interface ChecklistTemplateItem {
  id: string;
  question: string;
  description?: string;
  isRequired: boolean;
  requiresComment: boolean;
  requiresImage: boolean;
  applicableStores: string[];
  applicableDays: number[];
}

export interface ChecklistExecution {
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

export interface ChecklistResponse {
  itemId: string;
  question?: string;
  response: boolean | null;
  comment?: string;
  imageUrl?: string;
  skipped: boolean;
  completedAt?: Date;
}

export interface ChecklistHistory {
  id: string;
  templateName: string;
  type: 'opening' | 'closing' | 'quality' | 'maintenance';
  storeName: string;
  userName: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  totalItems: number;
  completedItems: number;
  responses: ChecklistResponse[];
}

interface ChecklistContextType {
  templates: ChecklistTemplate[];
  setTemplates: React.Dispatch<React.SetStateAction<ChecklistTemplate[]>>;
  addTemplate: (template: Omit<ChecklistTemplate, 'id' | 'createdAt' | 'lastEditedAt' | 'usageCount'>) => void;
  updateTemplate: (id: string, updates: Partial<ChecklistTemplate>) => void;
  deleteTemplate: (id: string) => void;
  toggleTemplateStatus: (id: string) => void;
  executions: ChecklistExecution[];
  setExecutions: React.Dispatch<React.SetStateAction<ChecklistExecution[]>>;
  addExecution: (execution: Omit<ChecklistExecution, 'id'>) => ChecklistExecution;
  updateExecution: (id: string, updates: Partial<ChecklistExecution>) => void;
  deleteExecution: (id: string) => void;
  history: ChecklistHistory[];
  addToHistory: (execution: ChecklistExecution, storeName?: string, userName?: string) => void;
  getTemplateById: (id: string) => ChecklistTemplate | undefined;
  getExecutionById: (id: string) => ChecklistExecution | undefined;
  getPendingExecutions: () => ChecklistExecution[];
  getCompletedExecutions: () => ChecklistExecution[];
}

const ChecklistContext = createContext<ChecklistContextType | undefined>(undefined);

export const ChecklistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { selectedBrand } = useBrand();
  const brandId = selectedBrand?.id;

  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [executions, setExecutions] = useState<ChecklistExecution[]>([]);
  const [history, setHistory] = useState<ChecklistHistory[]>([]);

  const loadData = useCallback(async () => {
    if (!brandId) return;
    try {
      const [dbTemplates, dbExecs, dbHistory] = await Promise.all([
        checklistService.getTemplates(brandId),
        checklistService.getExecutions(brandId),
        checklistService.getHistory(brandId),
      ]);

      setTemplates(dbTemplates.map(t => ({
        id: t.id, name: t.name, description: t.description, type: t.type,
        items: t.items ?? [], associatedStores: t.associated_stores ?? [],
        frequency: t.frequency, isActive: t.is_active, usageCount: t.usage_count,
        createdAt: new Date(t.created_at), lastEditedAt: new Date(t.last_edited_at),
      })));

      setExecutions(dbExecs.filter(e => e.status !== 'completed').map(e => ({
        id: e.id, templateId: e.template_id || '', templateName: e.template_name,
        storeId: e.store_id, userId: e.user_id || '',
        startTime: new Date(e.start_time), endTime: e.end_time ? new Date(e.end_time) : undefined,
        status: e.status, responses: (e.responses ?? []).map((r: any) => ({
          ...r, completedAt: r.completedAt ? new Date(r.completedAt) : undefined,
        })),
        currentItemIndex: e.current_item_index,
      })));

      setHistory(dbHistory.map(h => ({
        id: h.id, templateName: h.template_name, type: h.type as any,
        storeName: h.store_name, userName: h.user_name,
        startTime: new Date(h.start_time), endTime: new Date(h.end_time),
        duration: h.duration, totalItems: h.total_items, completedItems: h.completed_items,
        responses: (h.responses ?? []).map((r: any) => ({
          ...r, completedAt: r.completedAt ? new Date(r.completedAt) : undefined,
        })),
      })));
    } catch (err) {
      console.error('Error loading checklist data:', err?.message);
    }
  }, [brandId]);

  useEffect(() => { loadData(); }, [loadData]);

  const addTemplate = (templateData: Omit<ChecklistTemplate, 'id' | 'createdAt' | 'lastEditedAt' | 'usageCount'>) => {
    if (!brandId) return;
    (async () => {
      try {
        const created = await checklistService.createTemplate({
          brand_id: brandId, name: templateData.name, description: templateData.description,
          type: templateData.type, items: templateData.items,
          associated_stores: templateData.associatedStores, frequency: templateData.frequency,
          is_active: templateData.isActive,
        });
        setTemplates(prev => [...prev, {
          ...templateData, id: created.id, createdAt: new Date(created.created_at),
          lastEditedAt: new Date(created.last_edited_at), usageCount: 0,
        }]);
        toast({ title: "Template criado", description: "Novo template foi criado com sucesso." });
      } catch (err) { console.error(err?.message || 'Operation failed'); }
    })();
  };

  const updateTemplate = (id: string, updates: Partial<ChecklistTemplate>) => {
    (async () => {
      try {
        const dbUpdate: any = {};
        if (updates.name !== undefined) dbUpdate.name = updates.name;
        if (updates.description !== undefined) dbUpdate.description = updates.description;
        if (updates.type !== undefined) dbUpdate.type = updates.type;
        if (updates.items !== undefined) dbUpdate.items = updates.items;
        if (updates.associatedStores !== undefined) dbUpdate.associated_stores = updates.associatedStores;
        if (updates.frequency !== undefined) dbUpdate.frequency = updates.frequency;
        if (updates.isActive !== undefined) dbUpdate.is_active = updates.isActive;
        if (updates.usageCount !== undefined) dbUpdate.usage_count = updates.usageCount;
        await checklistService.updateTemplate(id, dbUpdate);
        setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...updates, lastEditedAt: new Date() } : t));
        toast({ title: "Template atualizado", description: "Template foi atualizado com sucesso." });
      } catch (err) { console.error(err?.message || 'Operation failed'); }
    })();
  };

  const deleteTemplate = (id: string) => {
    (async () => {
      try {
        await checklistService.deleteTemplate(id);
        setTemplates(prev => prev.filter(t => t.id !== id));
        toast({ title: "Template removido", description: "Template foi removido com sucesso." });
      } catch (err) { console.error(err?.message || 'Operation failed'); }
    })();
  };

  const toggleTemplateStatus = (id: string) => {
    const template = templates.find(t => t.id === id);
    if (!template) return;
    (async () => {
      try {
        await checklistService.updateTemplate(id, { is_active: !template.isActive });
        setTemplates(prev => prev.map(t => t.id === id ? { ...t, isActive: !t.isActive, lastEditedAt: new Date() } : t));
      } catch (err) { console.error(err?.message || 'Operation failed'); }
    })();
  };

  const addExecution = (executionData: Omit<ChecklistExecution, 'id'>): ChecklistExecution => {
    const tempId = Date.now().toString();
    const newExecution: ChecklistExecution = { ...executionData, id: tempId };
    setExecutions(prev => [...prev, newExecution]);

    if (brandId) {
      (async () => {
        try {
          const created = await checklistService.createExecution({
            brand_id: brandId, template_id: executionData.templateId || null,
            template_name: executionData.templateName, store_id: executionData.storeId,
            user_id: executionData.userId || null, start_time: executionData.startTime.toISOString(),
            end_time: executionData.endTime?.toISOString() ?? null, status: executionData.status,
            responses: executionData.responses.map(r => ({
              ...r, completedAt: r.completedAt instanceof Date ? r.completedAt.toISOString() : r.completedAt,
            })) as any,
            current_item_index: executionData.currentItemIndex,
          });
          setExecutions(prev => prev.map(e => e.id === tempId ? { ...e, id: created.id } : e));
        } catch (err) { console.error(err?.message || 'Operation failed'); }
      })();
    }

    return newExecution;
  };

  const updateExecution = (id: string, updates: Partial<ChecklistExecution>) => {
    setExecutions(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    (async () => {
      try {
        const dbUpdate: any = {};
        if (updates.status !== undefined) dbUpdate.status = updates.status;
        if (updates.endTime !== undefined) dbUpdate.end_time = updates.endTime?.toISOString() ?? null;
        if (updates.responses !== undefined) dbUpdate.responses = updates.responses.map(r => ({
          ...r, completedAt: r.completedAt instanceof Date ? r.completedAt.toISOString() : r.completedAt,
        }));
        if (updates.currentItemIndex !== undefined) dbUpdate.current_item_index = updates.currentItemIndex;
        await checklistService.updateExecution(id, dbUpdate);
      } catch (err) { console.error(err?.message || 'Operation failed'); }
    })();
  };

  const deleteExecution = (id: string) => {
    setExecutions(prev => prev.filter(e => e.id !== id));
    (async () => {
      try { await checklistService.deleteExecution(id); } catch (err) { console.error(err?.message || 'Operation failed'); }
    })();
  };

  const addToHistory = (execution: ChecklistExecution, storeName?: string, userName?: string) => {
    if (execution.status !== 'completed' || !brandId) return;
    const historyItem: ChecklistHistory = {
      id: execution.id,
      templateName: execution.templateName,
      type: templates.find(t => t.id === execution.templateId)?.type || 'quality',
      storeName: storeName || 'Loja desconhecida',
      userName: userName || 'Usuário desconhecido',
      startTime: execution.startTime,
      endTime: execution.endTime || new Date(),
      duration: execution.endTime ? Math.round((execution.endTime.getTime() - execution.startTime.getTime()) / 60000) : 0,
      totalItems: execution.responses.length,
      completedItems: execution.responses.filter(r => r.response !== null || r.skipped).length,
      responses: execution.responses,
    };
    setHistory(prev => [historyItem, ...prev]);

    (async () => {
      try {
        await checklistService.addToHistory({
          brand_id: brandId, template_name: historyItem.templateName, type: historyItem.type,
          store_name: historyItem.storeName, user_name: historyItem.userName,
          start_time: historyItem.startTime.toISOString(), end_time: historyItem.endTime.toISOString(),
          duration: historyItem.duration, total_items: historyItem.totalItems,
          completed_items: historyItem.completedItems,
          responses: historyItem.responses.map(r => ({
            ...r, completedAt: r.completedAt instanceof Date ? r.completedAt.toISOString() : r.completedAt,
          })) as any,
        });
      } catch (err) { console.error(err?.message || 'Operation failed'); }
    })();
  };

  const getTemplateById = (id: string) => templates.find(t => t.id === id);
  const getExecutionById = (id: string) => executions.find(e => e.id === id);
  const getPendingExecutions = () => executions.filter(e => e.status !== 'completed');
  const getCompletedExecutions = () => executions.filter(e => e.status === 'completed');

  const value: ChecklistContextType = {
    templates, setTemplates, addTemplate, updateTemplate, deleteTemplate, toggleTemplateStatus,
    executions, setExecutions, addExecution, updateExecution, deleteExecution,
    history, addToHistory,
    getTemplateById, getExecutionById, getPendingExecutions, getCompletedExecutions,
  };

  return (
    <ChecklistContext.Provider value={value}>
      {children}
    </ChecklistContext.Provider>
  );
};

export const useChecklist = () => {
  const context = useContext(ChecklistContext);
  if (context === undefined) {
    throw new Error('useChecklist must be used within a ChecklistProvider');
  }
  return context;
};
