import React, { createContext, useContext, useState } from 'react';

type Language = 'pt' | 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  pt: {
    sidebar: {
      dashboard: 'Dashboard',
      inventory: 'Estoque',
      operations: 'Operações',
      transit: 'Trânsito',
      purchases: 'Compras',
      cashbox: 'Caixa',
      invoices: 'Faturas',
      checklists: 'Checklists',
      settings: 'Configurações'
    },
    dashboard: {
      title: 'Dashboard',
      overview: 'Visão Geral',
      totalStores: 'Total de Lojas',
      lowStockItems: 'Itens com Estoque Baixo',
      openCashRegisters: 'Caixas Abertos',
      overdueInvoices: 'Faturas Vencidas',
      recentActivity: 'Atividade Recente',
      quickActions: 'Ações Rápidas',
      addProduct: 'Adicionar Produto',
      openCash: 'Abrir Caixa',
      viewReports: 'Ver Relatórios'
    },
    inventory: {
      title: 'Gestão de Estoque',
      search: 'Buscar produtos...',
      filterByStore: 'Filtrar por loja',
      filterByCategory: 'Filtrar por categoria',
      product: 'Produto',
      sku: 'SKU',
      category: 'Categoria',
      store: 'Loja',
      stock: 'Estoque',
      minStock: 'Estoque Mínimo',
      actions: 'Ações',
      addProduct: 'Adicionar Produto',
      editProduct: 'Editar Produto',
      addMovement: 'Adicionar Movimento'
    },
    operations: {
      title: 'Operações',
      description: 'Gerencie retiradas e movimentações de estoque',
      history: 'Histórico',
      searchProducts: 'Buscar produtos...',
      selectStore: 'Selecionar loja',
      selectCategory: 'Selecionar categoria',
      allStores: 'Todas as lojas',
      allCategories: 'Todas as categorias',
      availableProducts: 'Produtos Disponíveis',
      withdraw: 'Retirar',
      units: 'unidades',
      noProductsAvailable: 'Nenhum produto disponível para retirada',
      recentOperations: 'Operações Recentes',
      product: 'Produto',
      quantity: 'Quantidade',
      date: 'Data',
      user: 'Usuário',
      noRecentOperations: 'Nenhuma operação recente',
      withdrawStock: 'Retirar Estoque',
      productInfo: 'Informações do Produto',
      productName: 'Nome do Produto',
      category: 'Categoria',
      sku: 'SKU',
      sellingPrice: 'Preço de Venda',
      store: 'Loja',
      currentStock: 'Estoque Atual',
      minimumStock: 'Estoque Mínimo',
      lowStockWarning: 'Atenção: Estoque baixo!',
      quantityToWithdraw: 'Quantidade a Retirar',
      enterQuantity: 'Digite a quantidade',
      remainingAfterWithdrawal: 'Restará após retirada',
      notes: 'Observações',
      optional: 'opcional',
      addNotes: 'Adicione observações sobre esta retirada...',
      recentMovements: 'Movimentações Recentes',
      cancel: 'Cancelar',
      confirmWithdrawal: 'Confirmar Retirada',
      processing: 'Processando...',
      error: 'Erro',
      success: 'Sucesso',
      selectStoreRequired: 'Selecione uma loja',
      invalidQuantity: 'Quantidade inválida',
      insufficientStock: 'Estoque insuficiente',
      lowStockAlert: 'Alerta de Estoque Baixo',
      belowMinimumStock: 'ficou abaixo do estoque mínimo',
      withdrawalCompleted: 'Retirada realizada com sucesso',
      withdrawalFailed: 'Falha ao realizar retirada'
    },
    transit: {
      title: 'Gestão de Trânsito',
      description: 'Gerencie transferências entre lojas'
    },
    purchases: {
      title: 'Sugestões de Compra',
      description: 'Produtos com estoque baixo que precisam ser repostos'
    },
    cashbox: {
      title: 'Gestão de Caixa',
      description: 'Controle de abertura e fechamento de caixas'
    },
    invoices: {
      title: 'Gestão de Faturas',
      description: 'Controle de faturas de fornecedores'
    },
    checklists: {
      title: 'Checklists',
      description: 'Listas de verificação para operações diárias',
      opening: 'Abertura',
      opening_description: 'Checklist para abertura da loja',
      closing: 'Fechamento',
      closing_description: 'Checklist para fechamento da loja',
      quality: 'Qualidade',
      quality_description: 'Verificação de qualidade e processos',
      all_types: 'Todos os tipos',
      new_checklist: 'Novo Checklist'
    },
    settings: {
      title: 'Configurações',
      description: 'Configurações do sistema'
    }
  },
  en: {
    sidebar: {
      dashboard: 'Dashboard',
      inventory: 'Inventory',
      operations: 'Operations',
      transit: 'Transit',
      purchases: 'Purchases',
      cashbox: 'Cash',
      invoices: 'Invoices',
      checklists: 'Checklists',
      settings: 'Settings'
    },
    dashboard: {
      title: 'Dashboard',
      overview: 'Overview',
      totalStores: 'Total Stores',
      lowStockItems: 'Low Stock Items',
      openCashRegisters: 'Open Cash Registers',
      overdueInvoices: 'Overdue Invoices',
      recentActivity: 'Recent Activity',
      quickActions: 'Quick Actions',
      addProduct: 'Add Product',
      openCash: 'Open Cash',
      viewReports: 'View Reports'
    },
    inventory: {
      title: 'Inventory Management',
      search: 'Search products...',
      filterByStore: 'Filter by store',
      filterByCategory: 'Filter by category',
      product: 'Product',
      sku: 'SKU',
      category: 'Category',
      store: 'Store',
      stock: 'Stock',
      minStock: 'Min Stock',
      actions: 'Actions',
      addProduct: 'Add Product',
      editProduct: 'Edit Product',
      addMovement: 'Add Movement'
    },
    operations: {
      title: 'Operations',
      description: 'Manage stock withdrawals and movements',
      history: 'History',
      searchProducts: 'Search products...',
      selectStore: 'Select store',
      selectCategory: 'Select category',
      allStores: 'All stores',
      allCategories: 'All categories',
      availableProducts: 'Available Products',
      withdraw: 'Withdraw',
      units: 'units',
      noProductsAvailable: 'No products available for withdrawal',
      recentOperations: 'Recent Operations',
      product: 'Product',
      quantity: 'Quantity',
      date: 'Date',
      user: 'User',
      noRecentOperations: 'No recent operations',
      withdrawStock: 'Withdraw Stock',
      productInfo: 'Product Information',
      productName: 'Product Name',
      category: 'Category',
      sku: 'SKU',
      sellingPrice: 'Selling Price',
      store: 'Store',
      currentStock: 'Current Stock',
      minimumStock: 'Minimum Stock',
      lowStockWarning: 'Warning: Low stock!',
      quantityToWithdraw: 'Quantity to Withdraw',
      enterQuantity: 'Enter quantity',
      remainingAfterWithdrawal: 'Will remain after withdrawal',
      notes: 'Notes',
      optional: 'optional',
      addNotes: 'Add notes about this withdrawal...',
      recentMovements: 'Recent Movements',
      cancel: 'Cancel',
      confirmWithdrawal: 'Confirm Withdrawal',
      processing: 'Processing...',
      error: 'Error',
      success: 'Success',
      selectStoreRequired: 'Select a store',
      invalidQuantity: 'Invalid quantity',
      insufficientStock: 'Insufficient stock',
      lowStockAlert: 'Low Stock Alert',
      belowMinimumStock: 'is below minimum stock',
      withdrawalCompleted: 'Withdrawal completed successfully',
      withdrawalFailed: 'Failed to perform withdrawal'
    },
    transit: {
      title: 'Transit Management',
      description: 'Manage transfers between stores'
    },
    purchases: {
      title: 'Purchase Suggestions',
      description: 'Low stock products that need replenishment'
    },
    cashbox: {
      title: 'Cash Management',
      description: 'Control cash register opening and closing'
    },
    invoices: {
      title: 'Invoice Management',
      description: 'Supplier invoice control'
    },
    checklists: {
      title: 'Checklists',
      description: 'Verification lists for daily operations',
      opening: 'Opening',
      opening_description: 'Store opening checklist',
      closing: 'Closing',
      closing_description: 'Store closing checklist',
      quality: 'Quality',
      quality_description: 'Quality and process verification',
      all_types: 'All types',
      new_checklist: 'New Checklist'
    },
    settings: {
      title: 'Settings',
      description: 'System settings'
    }
  },
  es: {
    sidebar: {
      dashboard: 'Dashboard',
      inventory: 'Inventario',
      operations: 'Operaciones',
      transit: 'Tránsito',
      purchases: 'Compras',
      cashbox: 'Caja',
      invoices: 'Facturas',
      checklists: 'Listas',
      settings: 'Configuraciones'
    },
    dashboard: {
      title: 'Dashboard',
      overview: 'Resumen',
      totalStores: 'Total de Tiendas',
      lowStockItems: 'Artículos con Stock Bajo',
      openCashRegisters: 'Cajas Abiertas',
      overdueInvoices: 'Facturas Vencidas',
      recentActivity: 'Actividad Reciente',
      quickActions: 'Acciones Rápidas',
      addProduct: 'Agregar Producto',
      openCash: 'Abrir Caja',
      viewReports: 'Ver Reportes'
    },
    inventory: {
      title: 'Gestión de Inventario',
      search: 'Buscar productos...',
      filterByStore: 'Filtrar por tienda',
      filterByCategory: 'Filtrar por categoría',
      product: 'Producto',
      sku: 'SKU',
      category: 'Categoría',
      store: 'Tienda',
      stock: 'Stock',
      minStock: 'Stock Mínimo',
      actions: 'Acciones',
      addProduct: 'Agregar Producto',
      editProduct: 'Editar Producto',
      addMovement: 'Agregar Movimiento'
    },
    operations: {
      title: 'Operaciones',
      description: 'Gestiona retiros y movimientos de inventario',
      history: 'Historial',
      searchProducts: 'Buscar productos...',
      selectStore: 'Seleccionar tienda',
      selectCategory: 'Seleccionar categoría',
      allStores: 'Todas las tiendas',
      allCategories: 'Todas las categorías',
      availableProducts: 'Productos Disponibles',
      withdraw: 'Retirar',
      units: 'unidades',
      noProductsAvailable: 'No hay productos disponibles para retiro',
      recentOperations: 'Operaciones Recientes',
      product: 'Producto',
      quantity: 'Cantidad',
      date: 'Fecha',
      user: 'Usuario',
      noRecentOperations: 'No hay operaciones recientes',
      withdrawStock: 'Retirar Inventario',
      productInfo: 'Información del Producto',
      productName: 'Nombre del Producto',
      category: 'Categoría',
      sku: 'SKU',
      sellingPrice: 'Precio de Venta',
      store: 'Tienda',
      currentStock: 'Inventario Actual',
      minimumStock: 'Inventario Mínimo',
      lowStockWarning: '¡Advertencia: Inventario bajo!',
      quantityToWithdraw: 'Cantidad a Retirar',
      enterQuantity: 'Ingrese la cantidad',
      remainingAfterWithdrawal: 'Quedará después del retiro',
      notes: 'Notas',
      optional: 'opcional',
      addNotes: 'Agregue notas sobre este retiro...',
      recentMovements: 'Movimientos Recientes',
      cancel: 'Cancelar',
      confirmWithdrawal: 'Confirmar Retiro',
      processing: 'Procesando...',
      error: 'Error',
      success: 'Éxito',
      selectStoreRequired: 'Seleccione una tienda',
      invalidQuantity: 'Cantidad inválida',
      insufficientStock: 'Inventario insuficiente',
      lowStockAlert: 'Alerta de Inventario Bajo',
      belowMinimumStock: 'está por debajo del inventario mínimo',
      withdrawalCompleted: 'Retiro completado exitosamente',
      withdrawalFailed: 'Error al realizar el retiro'
    },
    transit: {
      title: 'Gestión de Tránsito',
      description: 'Gestionar transferencias entre tiendas'
    },
    purchases: {
      title: 'Sugerencias de Compra',
      description: 'Productos con stock bajo que necesitan reposición'
    },
    cashbox: {
      title: 'Gestión de Caja',
      description: 'Control de apertura y cierre de cajas'
    },
    invoices: {
      title: 'Gestión de Facturas',
      description: 'Control de facturas de proveedores'
    },
    checklists: {
      title: 'Listas de Verificación',
      description: 'Listas de verificación para operaciones diarias',
      opening: 'Apertura',
      opening_description: 'Lista de verificación para apertura de tienda',
      closing: 'Cierre',
      closing_description: 'Lista de verificación para cierre de tienda',
      quality: 'Calidad',
      quality_description: 'Verificación de calidad y procesos',
      all_types: 'Todos los tipos',
      new_checklist: 'Nueva Lista'
    },
    settings: {
      title: 'Configuraciones',
      description: 'Configuraciones del sistema'
    }
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('pt');

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
