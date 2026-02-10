import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

// Interfaces
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

// Context interface
interface ChecklistContextType {
  // Templates
  templates: ChecklistTemplate[];
  setTemplates: React.Dispatch<React.SetStateAction<ChecklistTemplate[]>>;
  addTemplate: (template: Omit<ChecklistTemplate, 'id' | 'createdAt' | 'lastEditedAt' | 'usageCount'>) => void;
  updateTemplate: (id: string, updates: Partial<ChecklistTemplate>) => void;
  deleteTemplate: (id: string) => void;
  toggleTemplateStatus: (id: string) => void;
  
  // Executions
  executions: ChecklistExecution[];
  setExecutions: React.Dispatch<React.SetStateAction<ChecklistExecution[]>>;
  addExecution: (execution: Omit<ChecklistExecution, 'id'>) => ChecklistExecution;
  updateExecution: (id: string, updates: Partial<ChecklistExecution>) => void;
  deleteExecution: (id: string) => void;
  
  // History
  history: ChecklistHistory[];
  addToHistory: (execution: ChecklistExecution) => void;
  
  // Utils
  getTemplateById: (id: string) => ChecklistTemplate | undefined;
  getExecutionById: (id: string) => ChecklistExecution | undefined;
  getPendingExecutions: () => ChecklistExecution[];
  getCompletedExecutions: () => ChecklistExecution[];
}

// Create context
const ChecklistContext = createContext<ChecklistContextType | undefined>(undefined);

// Provider component
export const ChecklistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([
    {
      id: '1',
      name: 'Checklist Abertura',
      description: 'Verificações essenciais para abertura da loja',
      type: 'opening',
      items: [
        {
          id: '1-1',
          question: 'Equipamentos ligados e funcionando?',
          description: 'Verificar blender, máquina de açaí, etc.',
          isRequired: true,
          requiresComment: false,
          requiresImage: false,
          applicableStores: ['all'],
          applicableDays: [0, 1, 2, 3, 4, 5, 6]
        },
        {
          id: '1-2',
          question: 'Área de trabalho limpa e organizada?',
          description: 'Balcões, equipamentos e utensílios',
          isRequired: true,
          requiresComment: true,
          requiresImage: true,
          applicableStores: ['all'],
          applicableDays: [0, 1, 2, 3, 4, 5, 6]
        },
        {
          id: '1-3',
          question: 'Estoque de ingredientes verificado?',
          description: 'Açaí, frutas, complementos',
          isRequired: true,
          requiresComment: false,
          requiresImage: false,
          applicableStores: ['all'],
          applicableDays: [0, 1, 2, 3, 4, 5, 6]
        }
      ],
      associatedStores: ['all'],
      frequency: 'daily',
      isActive: true,
      createdAt: new Date('2024-06-01'),
      lastEditedAt: new Date('2024-07-01'),
      usageCount: 25
    },
    {
      id: '2',
      name: 'Checklist Fechamento',
      description: 'Procedimentos para fechamento seguro da loja',
      type: 'closing',
      items: [
        {
          id: '2-1',
          question: 'Limpeza completa realizada?',
          description: 'Equipamentos, bancadas e área de produção',
          isRequired: true,
          requiresComment: true,
          requiresImage: true,
          applicableStores: ['all'],
          applicableDays: [0, 1, 2, 3, 4, 5, 6]
        },
        {
          id: '2-2',
          question: 'Equipamentos desligados?',
          description: 'Todos os equipamentos não essenciais',
          isRequired: true,
          requiresComment: false,
          requiresImage: false,
          applicableStores: ['all'],
          applicableDays: [0, 1, 2, 3, 4, 5, 6]
        }
      ],
      associatedStores: ['all'],
      frequency: 'daily',
      isActive: true,
      createdAt: new Date('2024-06-01'),
      lastEditedAt: new Date('2024-07-01'),
      usageCount: 22
    },
    {
      id: '3',
      name: 'Verificação de Qualidade',
      description: 'Controle de qualidade dos produtos',
      type: 'quality',
      items: [
        {
          id: '3-1',
          question: 'Produtos dentro da validade?',
          description: 'Verificar datas de validade de todos os produtos',
          isRequired: true,
          requiresComment: false,
          requiresImage: false,
          applicableStores: ['all'],
          applicableDays: [0, 1, 2, 3, 4, 5, 6]
        },
        {
          id: '3-2',
          question: 'Temperatura dos equipamentos adequada?',
          description: 'Freezers e geladeiras na temperatura correta',
          isRequired: true,
          requiresComment: true,
          requiresImage: false,
          applicableStores: ['all'],
          applicableDays: [0, 1, 2, 3, 4, 5, 6]
        }
      ],
      associatedStores: ['all'],
      frequency: 'weekly',
      isActive: true,
      createdAt: new Date('2024-06-15'),
      lastEditedAt: new Date('2024-07-01'),
      usageCount: 8
    }
  ]);

  const [executions, setExecutions] = useState<ChecklistExecution[]>([]);
  const [history, setHistory] = useState<ChecklistHistory[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedExecutions = localStorage.getItem('checklist_executions');
    if (savedExecutions) {
      try {
        const parsed = JSON.parse(savedExecutions);
        setExecutions(parsed.filter((e: ChecklistExecution) => e.status !== 'completed'));
        
        // Convert completed executions to history
        const completedExecutions = parsed.filter((e: ChecklistExecution) => e.status === 'completed');
        const historyItems = completedExecutions.map((e: ChecklistExecution) => ({
          id: e.id,
          templateName: e.templateName,
          type: templates.find(t => t.id === e.templateId)?.type || 'quality',
          storeName: 'Loja', // Would come from store context
          userName: 'Usuário', // Would come from auth context
          startTime: new Date(e.startTime),
          endTime: new Date(e.endTime || new Date()),
          duration: e.endTime ? Math.round((new Date(e.endTime).getTime() - new Date(e.startTime).getTime()) / 60000) : 0,
          totalItems: e.responses.length,
          completedItems: e.responses.filter(r => r.response !== null || r.skipped).length,
          responses: e.responses
        }));
        setHistory(historyItems);
      } catch (error) {
        console.error('Error loading checklist data:', error);
      }
    }
  }, [templates]);

  // Save executions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('checklist_executions', JSON.stringify(executions));
  }, [executions]);

  // Template methods
  const addTemplate = (templateData: Omit<ChecklistTemplate, 'id' | 'createdAt' | 'lastEditedAt' | 'usageCount'>) => {
    const newTemplate: ChecklistTemplate = {
      ...templateData,
      id: Date.now().toString(),
      createdAt: new Date(),
      lastEditedAt: new Date(),
      usageCount: 0
    };
    setTemplates(prev => [...prev, newTemplate]);
    toast({
      title: "Template criado",
      description: "Novo template foi criado com sucesso.",
    });
  };

  const updateTemplate = (id: string, updates: Partial<ChecklistTemplate>) => {
    setTemplates(prev => prev.map(t => 
      t.id === id 
        ? { ...t, ...updates, lastEditedAt: new Date() }
        : t
    ));
    toast({
      title: "Template atualizado",
      description: "Template foi atualizado com sucesso.",
    });
  };

  const deleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    toast({
      title: "Template removido",
      description: "Template foi removido com sucesso.",
    });
  };

  const toggleTemplateStatus = (id: string) => {
    setTemplates(prev => prev.map(t => 
      t.id === id 
        ? { ...t, isActive: !t.isActive, lastEditedAt: new Date() }
        : t
    ));
  };

  // Execution methods
  const addExecution = (executionData: Omit<ChecklistExecution, 'id'>): ChecklistExecution => {
    const newExecution: ChecklistExecution = {
      ...executionData,
      id: Date.now().toString()
    };
    setExecutions(prev => [...prev, newExecution]);
    return newExecution;
  };

  const updateExecution = (id: string, updates: Partial<ChecklistExecution>) => {
    setExecutions(prev => prev.map(e => 
      e.id === id ? { ...e, ...updates } : e
    ));
  };

  const deleteExecution = (id: string) => {
    setExecutions(prev => prev.filter(e => e.id !== id));
  };

  // History methods
  const addToHistory = (execution: ChecklistExecution) => {
    if (execution.status === 'completed') {
      const historyItem: ChecklistHistory = {
        id: execution.id,
        templateName: execution.templateName,
        type: templates.find(t => t.id === execution.templateId)?.type || 'quality',
        storeName: 'Loja', // Would come from store context
        userName: 'Usuário', // Would come from auth context
        startTime: execution.startTime,
        endTime: execution.endTime || new Date(),
        duration: execution.endTime ? Math.round((execution.endTime.getTime() - execution.startTime.getTime()) / 60000) : 0,
        totalItems: execution.responses.length,
        completedItems: execution.responses.filter(r => r.response !== null || r.skipped).length,
        responses: execution.responses
      };
      setHistory(prev => [historyItem, ...prev]);
    }
  };

  // Utility methods
  const getTemplateById = (id: string) => templates.find(t => t.id === id);
  const getExecutionById = (id: string) => executions.find(e => e.id === id);
  const getPendingExecutions = () => executions.filter(e => e.status !== 'completed');
  const getCompletedExecutions = () => executions.filter(e => e.status === 'completed');

  const value: ChecklistContextType = {
    templates,
    setTemplates,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    toggleTemplateStatus,
    executions,
    setExecutions,
    addExecution,
    updateExecution,
    deleteExecution,
    history,
    addToHistory,
    getTemplateById,
    getExecutionById,
    getPendingExecutions,
    getCompletedExecutions
  };

  return (
    <ChecklistContext.Provider value={value}>
      {children}
    </ChecklistContext.Provider>
  );
};

// Hook to use the context
export const useChecklist = () => {
  const context = useContext(ChecklistContext);
  if (context === undefined) {
    throw new Error('useChecklist must be used within a ChecklistProvider');
  }
  return context;
};