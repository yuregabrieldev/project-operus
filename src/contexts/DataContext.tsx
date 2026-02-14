import React, { createContext, useContext, useState, useEffect } from 'react';

// Types
export interface Store {
  id: string;
  name: string;
  address: string;
  contact: string;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  supplierId: string;
  categoryId: string;
  costPrice: number;
  sellingPrice: number;
  barcode: string;
  imageUrl?: string;
  unit?: string;
}

export interface InventoryItem {
  id: string;
  storeId: string;
  productId: string;
  currentQuantity: number;
  minQuantity: number;
  lastUpdated: Date;
  alertWarning?: number;
  alertCritical?: number;
}

export interface CashRegister {
  id: string;
  storeId: string;
  openingBalance: number;
  closingBalance?: number;
  openedAt: Date;
  closedAt?: Date;
  openedBy: string;
  closedBy?: string;
  status: 'open' | 'closed';
}

export type InvoiceStatus = 'pedido_realizado' | 'mercadoria_recebida' | 'contas_a_pagar' | 'finalizado_pago' | 'cancelado' | 'finalizado_outros';

export interface Invoice {
  id: string;
  supplierId: string;
  invoiceNumber: string;
  amount: number;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate: Date;
  paidDate?: Date;
  storeId?: string;
  description?: string;
  orderNumber?: string;
  costCenter?: string;
  currency?: string;
  directDebit?: boolean;
  paymentMethod?: string;
  financialInstitution?: string;
  observations?: Array<{ user: string; text: string; date: string }>;
}

export interface CostCenter {
  id: string;
  name: string;
}

export type LicenseStatus = 'ativa' | 'expirada' | 'cancelada' | 'pendente';

export interface LicenseRenewal {
  id: string;
  issueDate: Date;
  renewalDate: Date;
  value: number;
  currency: string;
}

export interface LicenseContact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

export interface LicenseAttachment {
  id: string;
  description: string;
  createdAt: Date;
  file?: File;
  fileName?: string;
}

export interface License {
  id: string;
  name: string;
  storeIds: string[];
  description?: string;
  periodicity: 'mensal' | 'trimestral' | 'semestral' | 'anual';
  alertDays: number;
  status: LicenseStatus;
  renewals: LicenseRenewal[];
  contacts: LicenseContact[];
  attachments: LicenseAttachment[];
  observations: Array<{ user: string; text: string; date: string }>;
}

export interface WasteVariant {
  id: string;
  name: string;
  productIds: string[];
}

export interface WasteReason {
  id: string;
  name: string;
}

export interface WasteRecord {
  id: string;
  productId: string;
  variantId: string;
  storeId: string;
  userId: string;
  userName: string;
  quantity: number;
  reasonId: string;
  comment?: string;
  createdAt: Date;
}

export interface ChecklistTask {
  id: string;
  taskName: string;
  isCompleted: boolean;
}

export interface Checklist {
  id: string;
  storeId: string;
  type: 'opening' | 'closing' | 'quality';
  tasks: ChecklistTask[];
  completedAt?: Date;
  completedBy?: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  fromStoreId?: string;
  toStoreId?: string;
  quantity: number;
  status: 'pending' | 'in_transit' | 'delivered';
  createdAt: Date;
  userId: string;
  type: 'in' | 'out' | 'transfer';
}

export interface OperationLog {
  id: string;
  productId: string;
  storeId: string;
  userId: string;
  quantity: number;
  actionType: 'withdrawal' | 'entry';
  createdAt: Date;
  notes?: string;
}

export interface RecipeIngredient {
  productId: string;
  quantity: number;
}

export interface Recipe {
  id: string;
  name: string;
  finalProductId: string;
  ingredients: RecipeIngredient[];
  expectedYield: number;
  createdAt: Date;
  isActive: boolean;
}

export interface ProductionRecord {
  id: string;
  recipeId: string;
  storeId: string;
  userId: string;
  actualYield: number;
  ingredientsUsed: RecipeIngredient[];
  leftovers: Array<{
    productId: string;
    quantity: number;
    destination: string;
  }>;
  notes?: string;
  createdAt: Date;
}

export interface PurchaseOrderItem {
  productId: string;
  storeId: string;
  unit: string;
  quantity: number;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  userId: string;
  storeIds: string[];
  items: PurchaseOrderItem[];
  hasInvoiceManagement: boolean;
  hasTransitGenerated: boolean;
  invoiceId?: string;
  observation?: string;
  createdAt: Date;
}

interface DataContextType {
  // State
  stores: Store[];
  categories: Category[];
  suppliers: Supplier[];
  products: Product[];
  inventory: InventoryItem[];
  cashRegisters: CashRegister[];
  invoices: Invoice[];
  checklists: Checklist[];
  movements: InventoryMovement[];
  operationLogs: OperationLog[];
  recipes: Recipe[];
  productionRecords: ProductionRecord[];
  purchaseOrders: PurchaseOrder[];
  costCenters: CostCenter[];
  licenses: License[];
  wasteVariants: WasteVariant[];
  wasteReasons: WasteReason[];
  wasteRecords: WasteRecord[];

  // Actions
  addStore: (store: Omit<Store, 'id'>) => void;
  updateStore: (id: string, store: Partial<Store>) => void;
  deleteStore: (id: string) => void;

  addCategory: (category: Omit<Category, 'id'>) => void;
  deleteCategory: (id: string) => void;

  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  updateInventoryItem: (id: string, item: Partial<InventoryItem>) => void;

  addCashRegister: (cashRegister: Omit<CashRegister, 'id'>) => void;
  updateCashRegister: (id: string, cashRegister: Partial<CashRegister>) => void;

  addInvoice: (invoice: Omit<Invoice, 'id'>) => void;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => void;

  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  deleteSupplier: (id: string) => void;

  addCostCenter: (costCenter: Omit<CostCenter, 'id'>) => void;
  deleteCostCenter: (id: string) => void;

  addLicense: (license: Omit<License, 'id'>) => void;
  updateLicense: (id: string, license: Partial<License>) => void;
  deleteLicense: (id: string) => void;

  addWasteVariant: (variant: Omit<WasteVariant, 'id'>) => void;
  updateWasteVariant: (id: string, variant: Partial<WasteVariant>) => void;
  deleteWasteVariant: (id: string) => void;
  addWasteReason: (reason: Omit<WasteReason, 'id'>) => void;
  updateWasteReason: (id: string, reason: Partial<WasteReason>) => void;
  deleteWasteReason: (id: string) => void;
  addWasteRecord: (record: Omit<WasteRecord, 'id'>) => void;
  deleteWasteRecord: (id: string) => void;

  addChecklist: (checklist: Omit<Checklist, 'id'>) => void;
  updateChecklist: (id: string, checklist: Partial<Checklist>) => void;

  addMovement: (movement: Omit<InventoryMovement, 'id'>) => void;
  updateMovement: (id: string, movement: Partial<InventoryMovement>) => void;

  addOperationLog: (log: Omit<OperationLog, 'id'>) => void;
  getOperationLogsByProduct: (productId: string) => OperationLog[];

  addRecipe: (recipe: Omit<Recipe, 'id'>) => void;
  updateRecipe: (id: string, recipe: Partial<Recipe>) => void;
  deleteRecipe: (id: string) => void;

  addProductionRecord: (record: Omit<ProductionRecord, 'id'>) => void;
  getProductionRecordsByRecipe: (recipeId: string) => ProductionRecord[];

  addPurchaseOrder: (order: Omit<PurchaseOrder, 'id'>) => void;
  updatePurchaseOrder: (id: string, order: Partial<PurchaseOrder>) => void;
  deletePurchaseOrder: (id: string) => void;

  // Getters
  getProductById: (id: string) => Product | undefined;
  getStoreById: (id: string) => Store | undefined;
  getSupplierById: (id: string) => Supplier | undefined;
  getCategoryById: (id: string) => Category | undefined;
  getInventoryByStore: (storeId: string) => InventoryItem[];
  getLowStockItems: () => InventoryItem[];
  getOpenCashRegisters: () => CashRegister[];
  getOverdueInvoices: () => Invoice[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Mock data initialization
  const [stores, setStores] = useState<Store[]>([
    { id: '1', name: 'Loja Centro', address: 'Rua Principal, 123', contact: '(11) 1234-5678', isActive: true },
    { id: '2', name: 'Loja Shopping', address: 'Shopping Center, Loja 45', contact: '(11) 8765-4321', isActive: true },
    { id: '3', name: 'Loja Norte', address: 'Av. Norte, 456', contact: '(11) 5555-5555', isActive: true }
  ]);

  const [categories, setCategories] = useState<Category[]>([
    { id: '1', name: 'Eletrônicos' },
    { id: '2', name: 'Roupas' },
    { id: '3', name: 'Casa e Jardim' },
    { id: '4', name: 'Livros' },
    { id: '5', name: 'Alimentos' }
  ]);

  const [suppliers, setSuppliers] = useState<Supplier[]>([
    { id: '1', name: 'Tech Supply Co.', contact: '(11) 1111-1111', email: 'contato@techsupply.com' },
    { id: '2', name: 'Fashion Wholesale', contact: '(11) 2222-2222', email: 'vendas@fashionwholesale.com' },
    { id: '3', name: 'Home & Garden Ltd.', contact: '(11) 3333-3333', email: 'info@homeandgarden.com' }
  ]);

  const [products, setProducts] = useState<Product[]>([
    { id: '1', name: 'Smartphone Galaxy', sku: 'PHONE001', supplierId: '1', categoryId: '1', costPrice: 800, sellingPrice: 1200, barcode: '1234567890123', unit: 'UN.' },
    { id: '2', name: 'Camiseta Básica', sku: 'SHIRT001', supplierId: '2', categoryId: '2', costPrice: 20, sellingPrice: 50, barcode: '1234567890124', unit: 'UN.' },
    { id: '3', name: 'Vaso Decorativo', sku: 'VASE001', supplierId: '3', categoryId: '3', costPrice: 30, sellingPrice: 75, barcode: '1234567890125', unit: 'UN.' },
    { id: '4', name: 'Fone Bluetooth', sku: 'HEADPHONE001', supplierId: '1', categoryId: '1', costPrice: 100, sellingPrice: 180, barcode: '1234567890126', unit: 'UN.' },
    { id: '5', name: 'Jaqueta Jeans', sku: 'JACKET001', supplierId: '2', categoryId: '2', costPrice: 80, sellingPrice: 150, barcode: '1234567890127', unit: 'UN.' },
    { id: '6', name: 'Suco de Abacaxi 300ml', sku: 'JUICE001', supplierId: '3', categoryId: '5', costPrice: 3, sellingPrice: 8, barcode: '1234567890128', unit: 'UN.' },
    { id: '7', name: 'Abacaxi Inteiro', sku: 'FRUIT001', supplierId: '3', categoryId: '5', costPrice: 5, sellingPrice: 12, barcode: '1234567890129', unit: 'KG' },
    { id: '8', name: 'Casca de Abacaxi', sku: 'WASTE001', supplierId: '3', categoryId: '5', costPrice: 0, sellingPrice: 0, barcode: '1234567890130', unit: 'KG' }
  ]);

  const [inventory, setInventory] = useState<InventoryItem[]>([
    { id: '1', storeId: '1', productId: '1', currentQuantity: 15, minQuantity: 10, lastUpdated: new Date() },
    { id: '2', storeId: '1', productId: '2', currentQuantity: 5, minQuantity: 20, lastUpdated: new Date() },
    { id: '3', storeId: '2', productId: '1', currentQuantity: 8, minQuantity: 10, lastUpdated: new Date() },
    { id: '4', storeId: '2', productId: '3', currentQuantity: 25, minQuantity: 15, lastUpdated: new Date() },
    { id: '5', storeId: '3', productId: '4', currentQuantity: 3, minQuantity: 8, lastUpdated: new Date() },
    { id: '6', storeId: '1', productId: '7', currentQuantity: 50, minQuantity: 20, lastUpdated: new Date() },
    { id: '7', storeId: '1', productId: '6', currentQuantity: 10, minQuantity: 50, lastUpdated: new Date() },
    // Additional multi-store inventory for richer demo
    { id: '8', storeId: '2', productId: '2', currentQuantity: 30, minQuantity: 20, lastUpdated: new Date() },
    { id: '9', storeId: '3', productId: '2', currentQuantity: 12, minQuantity: 20, lastUpdated: new Date() },
    { id: '10', storeId: '3', productId: '1', currentQuantity: 20, minQuantity: 10, lastUpdated: new Date() },
    { id: '11', storeId: '2', productId: '4', currentQuantity: 18, minQuantity: 8, lastUpdated: new Date() },
    { id: '12', storeId: '1', productId: '4', currentQuantity: 22, minQuantity: 8, lastUpdated: new Date() },
    { id: '13', storeId: '3', productId: '3', currentQuantity: 7, minQuantity: 15, lastUpdated: new Date() },
    { id: '14', storeId: '1', productId: '3', currentQuantity: 10, minQuantity: 15, lastUpdated: new Date() },
    { id: '15', storeId: '2', productId: '7', currentQuantity: 35, minQuantity: 20, lastUpdated: new Date() },
    { id: '16', storeId: '3', productId: '7', currentQuantity: 28, minQuantity: 20, lastUpdated: new Date() },
    { id: '17', storeId: '2', productId: '6', currentQuantity: 45, minQuantity: 50, lastUpdated: new Date() },
    { id: '18', storeId: '3', productId: '6', currentQuantity: 60, minQuantity: 50, lastUpdated: new Date() },
    { id: '19', storeId: '1', productId: '5', currentQuantity: 14, minQuantity: 10, lastUpdated: new Date() },
    { id: '20', storeId: '2', productId: '5', currentQuantity: 9, minQuantity: 10, lastUpdated: new Date() },
    { id: '21', storeId: '3', productId: '5', currentQuantity: 6, minQuantity: 10, lastUpdated: new Date() },
  ]);

  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([
    { id: '1', storeId: '1', openingBalance: 500, openedAt: new Date(), openedBy: 'user1', status: 'open' },
    { id: '2', storeId: '2', openingBalance: 300, closingBalance: 450, openedAt: new Date(Date.now() - 86400000), closedAt: new Date(), openedBy: 'user2', closedBy: 'user2', status: 'closed' }
  ]);

  const [invoices, setInvoices] = useState<Invoice[]>([
    { id: '1', supplierId: '1', invoiceNumber: 'INV001', amount: 5000, status: 'pedido_realizado', issueDate: new Date(), dueDate: new Date(Date.now() + 30 * 86400000) },
    { id: '2', supplierId: '2', invoiceNumber: 'INV002', amount: 2500, status: 'contas_a_pagar', issueDate: new Date(Date.now() - 45 * 86400000), dueDate: new Date(Date.now() - 15 * 86400000) },
    { id: '3', supplierId: '3', invoiceNumber: 'INV003', amount: 1800, status: 'finalizado_pago', issueDate: new Date(Date.now() - 60 * 86400000), dueDate: new Date(Date.now() - 30 * 86400000), paidDate: new Date(Date.now() - 25 * 86400000) }
  ]);

  const [costCenters, setCostCenters] = useState<CostCenter[]>([
    { id: '1', name: '5544 - TESTE 2' },
    { id: '2', name: '4545 - Teste 9' },
    { id: '3', name: '5454 - Teste 49' },
    { id: '4', name: '4565 - Agora Vai' },
  ]);

  const [checklists, setChecklists] = useState<Checklist[]>([
    {
      id: '1',
      storeId: '1',
      type: 'opening',
      tasks: [
        { id: '1', taskName: 'Ligar luzes', isCompleted: true },
        { id: '2', taskName: 'Abrir caixa', isCompleted: true },
        { id: '3', taskName: 'Verificar produtos em destaque', isCompleted: false }
      ],
      completedAt: new Date(),
      completedBy: 'user1'
    }
  ]);

  const [movements, setMovements] = useState<InventoryMovement[]>([
    { id: '1', productId: '1', fromStoreId: '1', toStoreId: '2', quantity: 5, status: 'delivered', createdAt: new Date(), userId: 'user1', type: 'transfer' },
    { id: '2', productId: '2', toStoreId: '1', quantity: 10, status: 'delivered', createdAt: new Date(), userId: 'user1', type: 'in' },
    // In-transit movements for demo
    { id: '3', productId: '1', fromStoreId: '1', toStoreId: '3', quantity: 5, status: 'in_transit', createdAt: new Date(), userId: 'user1', type: 'transfer' },
    { id: '4', productId: '4', fromStoreId: '2', toStoreId: '1', quantity: 8, status: 'in_transit', createdAt: new Date(), userId: 'user1', type: 'transfer' },
    { id: '5', productId: '6', fromStoreId: '3', toStoreId: '2', quantity: 15, status: 'in_transit', createdAt: new Date(), userId: 'user1', type: 'transfer' },
    { id: '6', productId: '2', fromStoreId: '1', toStoreId: '2', quantity: 10, status: 'pending', createdAt: new Date(), userId: 'user1', type: 'transfer' },
  ]);

  const [operationLogs, setOperationLogs] = useState<OperationLog[]>([
    { id: '1', productId: '1', storeId: '1', userId: 'user1', quantity: 2, actionType: 'withdrawal', createdAt: new Date(Date.now() - 86400000), notes: 'Retirada para reposição' },
    { id: '2', productId: '2', storeId: '1', userId: 'user1', quantity: 5, actionType: 'withdrawal', createdAt: new Date(Date.now() - 172800000) },
    { id: '3', productId: '3', storeId: '2', userId: 'user2', quantity: 1, actionType: 'withdrawal', createdAt: new Date() }
  ]);

  const [recipes, setRecipes] = useState<Recipe[]>([
    {
      id: '1',
      name: 'Suco de Abacaxi',
      finalProductId: '6',
      ingredients: [{ productId: '7', quantity: 2 }],
      expectedYield: 600,
      createdAt: new Date(),
      isActive: true
    }
  ]);

  const [productionRecords, setProductionRecords] = useState<ProductionRecord[]>([]);

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([
    {
      id: '1',
      supplierId: '1',
      userId: 'user1',
      storeIds: ['1'],
      items: [
        { productId: '1', storeId: '1', unit: 'UN.', quantity: 5 },
        { productId: '4', storeId: '1', unit: 'UN.', quantity: 3 }
      ],
      hasInvoiceManagement: true,
      hasTransitGenerated: true,
      invoiceId: '1',
      observation: 'Pedido urgente de eletrônicos',
      createdAt: new Date()
    },
    {
      id: '2',
      supplierId: '2',
      userId: 'user1',
      storeIds: ['2'],
      items: [
        { productId: '2', storeId: '2', unit: 'UN.', quantity: 10 }
      ],
      hasInvoiceManagement: false,
      hasTransitGenerated: false,
      createdAt: new Date(Date.now() - 5 * 86400000)
    },
    {
      id: '3',
      supplierId: '3',
      userId: 'user1',
      storeIds: ['1', '3'],
      items: [
        { productId: '3', storeId: '1', unit: 'UN.', quantity: 8 },
        { productId: '6', storeId: '3', unit: 'UN.', quantity: 20 }
      ],
      hasInvoiceManagement: true,
      hasTransitGenerated: true,
      invoiceId: '3',
      observation: 'Reposição mensal',
      createdAt: new Date(Date.now() - 10 * 86400000)
    }
  ]);

  const [licenses, setLicenses] = useState<License[]>([
    {
      id: '1',
      name: 'Licença ASAE',
      storeIds: ['1', '2', '3'],
      description: 'Licença de funcionamento ASAE',
      periodicity: 'anual',
      alertDays: 10,
      status: 'ativa',
      renewals: [
        { id: '1', issueDate: new Date(2025, 5, 23), renewalDate: new Date(2026, 5, 24), value: 150, currency: '€' },
        { id: '2', issueDate: new Date(2025, 1, 1), renewalDate: new Date(2026, 1, 1), value: 100, currency: '€' },
      ],
      contacts: [{ id: '1', name: 'Joao', phone: '', email: '' }],
      attachments: [],
      observations: [
        { user: 'William Cardoso', text: 'Novo controle de licença criado.', date: '21/02/25 17:55' },
      ],
    },
    {
      id: '2',
      name: 'Licença de Esplanada',
      storeIds: ['2'],
      description: 'Licença de Esplanada',
      periodicity: 'mensal',
      alertDays: 10,
      status: 'expirada',
      renewals: [
        { id: '1', issueDate: new Date(2025, 4, 24), renewalDate: new Date(2025, 5, 23), value: 320, currency: '€' },
      ],
      contacts: [],
      attachments: [],
      observations: [
        { user: 'William Cardoso', text: 'Novo controle de licença criado.', date: '24/06/25 02:07' },
      ],
    },
  ]);

  const [wasteVariants, setWasteVariants] = useState<WasteVariant[]>([
    { id: '1', name: 'Grande', productIds: ['1', '2', '3', '6', '7'] },
    { id: '2', name: 'Médio', productIds: ['1', '2', '3', '6', '7'] },
    { id: '3', name: 'Pequeno', productIds: ['1', '2', '3', '6', '7'] },
  ]);

  const [wasteReasons, setWasteReasons] = useState<WasteReason[]>([
    { id: '1', name: 'Validade expirada' },
    { id: '2', name: 'Queda / Acidente' },
    { id: '3', name: 'Qualidade comprometida' },
    { id: '4', name: 'Outros' },
  ]);

  const [wasteRecords, setWasteRecords] = useState<WasteRecord[]>([
    {
      id: '1',
      productId: '6',
      variantId: '1',
      storeId: '1',
      userId: 'user1',
      userName: 'William Cardoso',
      quantity: 1,
      reasonId: '4',
      comment: 'Produto caiu no chão',
      createdAt: new Date(),
    },
    {
      id: '2',
      productId: '7',
      variantId: '2',
      storeId: '1',
      userId: 'user1',
      userName: 'William Cardoso',
      quantity: 2,
      reasonId: '1',
      createdAt: new Date(Date.now() - 86400000),
    },
  ]);

  // Helper functions
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Store actions
  const addStore = (store: Omit<Store, 'id'>) => {
    const newStore = { ...store, id: generateId() };
    setStores(prev => [...prev, newStore]);
  };

  const updateStore = (id: string, store: Partial<Store>) => {
    setStores(prev => prev.map(s => s.id === id ? { ...s, ...store } : s));
  };

  const deleteStore = (id: string) => {
    setStores(prev => prev.filter(s => s.id !== id));
  };

  // Category actions
  const addCategory = (category: Omit<Category, 'id'>) => {
    const newCategory = { ...category, id: generateId() };
    setCategories(prev => [...prev, newCategory]);
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  // Product actions
  const addProduct = (product: Omit<Product, 'id'>) => {
    const newProduct = { ...product, id: generateId() };
    setProducts(prev => [...prev, newProduct]);
  };

  const updateProduct = (id: string, product: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...product } : p));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  // Inventory actions
  const addInventoryItem = (item: Omit<InventoryItem, 'id'>) => {
    const newItem = { ...item, id: generateId() };
    setInventory(prev => [...prev, newItem]);
  };

  const updateInventoryItem = (id: string, item: Partial<InventoryItem>) => {
    setInventory(prev => prev.map(i => i.id === id ? { ...i, ...item, lastUpdated: new Date() } : i));
  };

  // Cash register actions
  const addCashRegister = (cashRegister: Omit<CashRegister, 'id'>) => {
    const newCashRegister = { ...cashRegister, id: generateId() };
    setCashRegisters(prev => [...prev, newCashRegister]);
  };

  const updateCashRegister = (id: string, cashRegister: Partial<CashRegister>) => {
    setCashRegisters(prev => prev.map(cr => cr.id === id ? { ...cr, ...cashRegister } : cr));
  };

  // Invoice actions
  const addInvoice = (invoice: Omit<Invoice, 'id'>) => {
    const newInvoice = { ...invoice, id: generateId() };
    setInvoices(prev => [...prev, newInvoice]);
  };

  const updateInvoice = (id: string, invoice: Partial<Invoice>) => {
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, ...invoice } : i));
  };

  // Checklist actions
  const addChecklist = (checklist: Omit<Checklist, 'id'>) => {
    const newChecklist = { ...checklist, id: generateId() };
    setChecklists(prev => [...prev, newChecklist]);
  };

  const updateChecklist = (id: string, checklist: Partial<Checklist>) => {
    setChecklists(prev => prev.map(c => c.id === id ? { ...c, ...checklist } : c));
  };

  // Movement actions
  const addMovement = (movement: Omit<InventoryMovement, 'id'>) => {
    const newMovement = { ...movement, id: generateId() };
    setMovements(prev => [...prev, newMovement]);
  };

  const updateMovement = (id: string, movement: Partial<InventoryMovement>) => {
    setMovements(prev => prev.map(m => m.id === id ? { ...m, ...movement } : m));
  };

  // Operation log actions
  const addOperationLog = (log: Omit<OperationLog, 'id'>) => {
    const newLog = { ...log, id: generateId() };
    setOperationLogs(prev => [...prev, newLog]);
  };

  const getOperationLogsByProduct = (productId: string) =>
    operationLogs.filter(log => log.productId === productId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  // Recipe actions
  const addRecipe = (recipe: Omit<Recipe, 'id'>) => {
    const newRecipe = { ...recipe, id: generateId() };
    setRecipes(prev => [...prev, newRecipe]);
  };

  const updateRecipe = (id: string, recipe: Partial<Recipe>) => {
    setRecipes(prev => prev.map(r => r.id === id ? { ...r, ...recipe } : r));
  };

  const deleteRecipe = (id: string) => {
    setRecipes(prev => prev.filter(r => r.id !== id));
  };

  // Production record actions
  const addProductionRecord = (record: Omit<ProductionRecord, 'id'>) => {
    const newRecord = { ...record, id: generateId() };
    setProductionRecords(prev => [...prev, newRecord]);
  };

  const getProductionRecordsByRecipe = (recipeId: string) =>
    productionRecords.filter(record => record.recipeId === recipeId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  // Purchase Order actions
  const addPurchaseOrder = (order: Omit<PurchaseOrder, 'id'>) => {
    const newOrder = { ...order, id: generateId() };
    setPurchaseOrders(prev => [...prev, newOrder]);
  };

  const updatePurchaseOrder = (id: string, order: Partial<PurchaseOrder>) => {
    setPurchaseOrders(prev => prev.map(o => o.id === id ? { ...o, ...order } : o));
  };

  const deletePurchaseOrder = (id: string) => {
    setPurchaseOrders(prev => prev.filter(o => o.id !== id));
  };

  // Getters
  const getProductById = (id: string) => products.find(p => p.id === id);
  const getStoreById = (id: string) => stores.find(s => s.id === id);
  const addSupplier = (supplier: Omit<Supplier, 'id'>) => {
    const newSupplier = { ...supplier, id: generateId() };
    setSuppliers(prev => [...prev, newSupplier]);
  };

  const deleteSupplier = (id: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== id));
  };

  const addCostCenter = (costCenter: Omit<CostCenter, 'id'>) => {
    const newCC = { ...costCenter, id: generateId() };
    setCostCenters(prev => [...prev, newCC]);
  };

  const deleteCostCenter = (id: string) => {
    setCostCenters(prev => prev.filter(cc => cc.id !== id));
  };

  // License actions
  const addLicense = (license: Omit<License, 'id'>) => {
    const newLicense = { ...license, id: generateId() };
    setLicenses(prev => [...prev, newLicense]);
  };

  const updateLicense = (id: string, license: Partial<License>) => {
    setLicenses(prev => prev.map(l => l.id === id ? { ...l, ...license } : l));
  };

  const deleteLicense = (id: string) => {
    setLicenses(prev => prev.filter(l => l.id !== id));
  };

  // Waste actions
  const addWasteVariant = (variant: Omit<WasteVariant, 'id'>) => {
    const newVariant = { ...variant, id: generateId() };
    setWasteVariants(prev => [...prev, newVariant]);
  };

  const updateWasteVariant = (id: string, variant: Partial<WasteVariant>) => {
    setWasteVariants(prev => prev.map(v => v.id === id ? { ...v, ...variant } : v));
  };

  const deleteWasteVariant = (id: string) => {
    setWasteVariants(prev => prev.filter(v => v.id !== id));
  };

  const addWasteReason = (reason: Omit<WasteReason, 'id'>) => {
    const newReason = { ...reason, id: generateId() };
    setWasteReasons(prev => [...prev, newReason]);
  };

  const updateWasteReason = (id: string, reason: Partial<WasteReason>) => {
    setWasteReasons(prev => prev.map(r => r.id === id ? { ...r, ...reason } : r));
  };

  const deleteWasteReason = (id: string) => {
    setWasteReasons(prev => prev.filter(r => r.id !== id));
  };

  const addWasteRecord = (record: Omit<WasteRecord, 'id'>) => {
    const newRecord = { ...record, id: generateId() };
    setWasteRecords(prev => [...prev, newRecord]);
  };

  const deleteWasteRecord = (id: string) => {
    setWasteRecords(prev => prev.filter(r => r.id !== id));
  };

  const getSupplierById = (id: string) => suppliers.find(s => s.id === id);
  const getCategoryById = (id: string) => categories.find(c => c.id === id);
  const getInventoryByStore = (storeId: string) => inventory.filter(i => i.storeId === storeId);
  const getLowStockItems = () => inventory.filter(i => i.currentQuantity <= i.minQuantity);
  const getOpenCashRegisters = () => cashRegisters.filter(cr => cr.status === 'open');
  const getOverdueInvoices = () => invoices.filter(i => i.status === 'contas_a_pagar');

  const value = {
    stores, categories, suppliers, products, inventory, cashRegisters, invoices, checklists, movements, operationLogs, recipes, productionRecords, purchaseOrders, costCenters, licenses, wasteVariants, wasteReasons, wasteRecords,
    addStore, updateStore, deleteStore,
    addProduct, updateProduct, deleteProduct,
    addInventoryItem, updateInventoryItem,
    addCashRegister, updateCashRegister,
    addCategory, deleteCategory,
    addInvoice, updateInvoice,
    addSupplier, deleteSupplier,
    addCostCenter, deleteCostCenter,
    addLicense, updateLicense, deleteLicense,
    addWasteVariant, updateWasteVariant, deleteWasteVariant,
    addWasteReason, updateWasteReason, deleteWasteReason,
    addWasteRecord, deleteWasteRecord,
    addChecklist, updateChecklist,
    addMovement, updateMovement,
    addOperationLog, getOperationLogsByProduct,
    addRecipe, updateRecipe, deleteRecipe,
    addProductionRecord, getProductionRecordsByRecipe,
    addPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder,
    getProductById, getStoreById, getSupplierById, getCategoryById,
    getInventoryByStore, getLowStockItems, getOpenCashRegisters, getOverdueInvoices
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
