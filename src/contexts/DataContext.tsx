import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useBrand } from './BrandContext';
import {
  categoriesService, suppliersService, productsService, inventoryService,
  costCentersService, cashService, invoicesService, movementsService,
  operationLogsService, purchaseOrdersService, recipesService, productionService,
  wasteService, licensesService, simpleChecklistsService,
} from '@/lib/supabase-services';

// Types - kept identical for backward compat
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
  dataLoading: boolean;

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
  const { selectedBrand, stores: brandStores } = useBrand();
  const brandId = selectedBrand?.id;

  const [dataLoading, setDataLoading] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [operationLogs, setOperationLogs] = useState<OperationLog[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [productionRecords, setProductionRecords] = useState<ProductionRecord[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [wasteVariants, setWasteVariants] = useState<WasteVariant[]>([]);
  const [wasteReasons, setWasteReasons] = useState<WasteReason[]>([]);
  const [wasteRecords, setWasteRecords] = useState<WasteRecord[]>([]);

  // Derive stores from BrandContext
  useEffect(() => {
    setStores(brandStores.map(s => ({
      id: s.id, name: s.name, address: s.address, contact: s.contact, isActive: s.isActive,
    })));
  }, [brandStores]);

  // Load all data when brand changes
  const loadAllData = useCallback(async () => {
    if (!brandId) return;
    setDataLoading(true);
    try {
      const [
        dbCats, dbSupp, dbProds, dbInv, dbCC, dbCash, dbInv2, dbMov,
        dbOpLogs, dbPO, dbRecipes, dbProdRecs, dbWV, dbWR, dbWRec,
        dbLic, dbCL,
      ] = await Promise.all([
        categoriesService.getByBrand(brandId),
        suppliersService.getByBrand(brandId),
        productsService.getByBrand(brandId),
        inventoryService.getByBrand(brandId),
        costCentersService.getByBrand(brandId),
        cashService.getByBrand(brandId),
        invoicesService.getByBrand(brandId),
        movementsService.getByBrand(brandId),
        operationLogsService.getByBrand(brandId),
        purchaseOrdersService.getByBrand(brandId),
        recipesService.getByBrand(brandId),
        productionService.getByBrand(brandId),
        wasteService.getVariants(brandId),
        wasteService.getReasons(brandId),
        wasteService.getRecords(brandId),
        licensesService.getByBrand(brandId),
        simpleChecklistsService.getByBrand(brandId),
      ]);

      setCategories(dbCats.map(c => ({ id: c.id, name: c.name })));
      setSuppliers(dbSupp.map(s => ({ id: s.id, name: s.name, contact: s.contact, email: s.email })));
      setProducts(dbProds.map(p => ({
        id: p.id, name: p.name, sku: p.sku,
        supplierId: p.supplier_id || '', categoryId: p.category_id || '',
        costPrice: Number(p.cost_price), sellingPrice: Number(p.selling_price),
        barcode: p.barcode, imageUrl: p.image_url ?? undefined, unit: p.unit,
      })));
      setInventory(dbInv.map(i => ({
        id: i.id, storeId: i.store_id, productId: i.product_id,
        currentQuantity: Number(i.current_quantity), minQuantity: Number(i.min_quantity),
        lastUpdated: new Date(i.last_updated),
        alertWarning: i.alert_warning != null ? Number(i.alert_warning) : undefined,
        alertCritical: i.alert_critical != null ? Number(i.alert_critical) : undefined,
      })));
      setCostCenters(dbCC.map(c => ({ id: c.id, name: c.name })));
      setCashRegisters(dbCash.map(cr => ({
        id: cr.id, storeId: cr.store_id,
        openingBalance: Number(cr.opening_balance),
        closingBalance: cr.closing_balance != null ? Number(cr.closing_balance) : undefined,
        openedAt: new Date(cr.opened_at), closedAt: cr.closed_at ? new Date(cr.closed_at) : undefined,
        openedBy: cr.opened_by, closedBy: cr.closed_by ?? undefined,
        status: cr.status,
      })));
      setInvoices(dbInv2.map(inv => ({
        id: inv.id, supplierId: inv.supplier_id || '', invoiceNumber: inv.invoice_number,
        amount: Number(inv.amount), status: inv.status as InvoiceStatus,
        issueDate: new Date(inv.issue_date), dueDate: new Date(inv.due_date || inv.issue_date),
        paidDate: inv.paid_date ? new Date(inv.paid_date) : undefined,
        storeId: inv.store_id ?? undefined, description: inv.description ?? undefined,
        orderNumber: inv.order_number ?? undefined, costCenter: inv.cost_center ?? undefined,
        currency: inv.currency, directDebit: inv.direct_debit,
        paymentMethod: inv.payment_method ?? undefined,
        financialInstitution: inv.financial_institution ?? undefined,
        observations: inv.observations ?? [],
      })));
      setMovements(dbMov.map(m => ({
        id: m.id, productId: m.product_id,
        fromStoreId: m.from_store_id ?? undefined, toStoreId: m.to_store_id ?? undefined,
        quantity: Number(m.quantity), status: m.status as any,
        createdAt: new Date(m.created_at), userId: m.user_id || '', type: m.type as any,
      })));
      setOperationLogs(dbOpLogs.map(l => ({
        id: l.id, productId: l.product_id, storeId: l.store_id,
        userId: l.user_id || '', quantity: Number(l.quantity),
        actionType: l.action_type as any, createdAt: new Date(l.created_at),
        notes: l.notes ?? undefined,
      })));
      setPurchaseOrders(dbPO.map(po => ({
        id: po.id, supplierId: po.supplier_id || '', userId: po.user_id || '',
        storeIds: po.store_ids ?? [], items: po.items ?? [],
        hasInvoiceManagement: po.has_invoice_management,
        hasTransitGenerated: po.has_transit_generated,
        invoiceId: po.invoice_id ?? undefined, observation: po.observation ?? undefined,
        createdAt: new Date(po.created_at),
      })));
      setRecipes(dbRecipes.map(r => ({
        id: r.id, name: r.name, finalProductId: r.final_product_id || '',
        ingredients: r.ingredients ?? [], expectedYield: Number(r.expected_yield),
        createdAt: new Date(r.created_at), isActive: r.is_active,
      })));
      setProductionRecords(dbProdRecs.map(pr => ({
        id: pr.id, recipeId: pr.recipe_id || '', storeId: pr.store_id,
        userId: pr.user_id || '', actualYield: Number(pr.actual_yield),
        ingredientsUsed: pr.ingredients_used ?? [], leftovers: pr.leftovers ?? [],
        notes: pr.notes ?? undefined, createdAt: new Date(pr.created_at),
      })));
      setWasteVariants(dbWV.map(v => ({ id: v.id, name: v.name, productIds: v.product_ids ?? [] })));
      setWasteReasons(dbWR.map(r => ({ id: r.id, name: r.name })));
      setWasteRecords(dbWRec.map(r => ({
        id: r.id, productId: r.product_id, variantId: r.variant_id || '',
        storeId: r.store_id, userId: r.user_id || '', userName: r.user_name,
        quantity: Number(r.quantity), reasonId: r.reason_id || '',
        comment: r.comment ?? undefined, createdAt: new Date(r.created_at),
      })));
      setLicenses(dbLic.map(l => ({
        id: l.id, name: l.name, storeIds: l.store_ids ?? [],
        description: l.description ?? undefined, periodicity: l.periodicity,
        alertDays: l.alert_days, status: l.status,
        renewals: (l.renewals ?? []).map((r: any) => ({
          ...r, issueDate: new Date(r.issueDate), renewalDate: new Date(r.renewalDate),
        })),
        contacts: l.contacts ?? [], attachments: (l.attachments ?? []).map((a: any) => ({
          ...a, createdAt: new Date(a.createdAt),
        })),
        observations: l.observations ?? [],
      })));
      setChecklists(dbCL.map(c => ({
        id: c.id, storeId: c.store_id, type: c.type, tasks: c.tasks ?? [],
        completedAt: c.completed_at ? new Date(c.completed_at) : undefined,
        completedBy: c.completed_by ?? undefined,
      })));
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setDataLoading(false);
    }
  }, [brandId]);

  useEffect(() => { loadAllData(); }, [loadAllData]);

  // ---- CRUD actions: insert into Supabase, then update local state ----

  const addStore = async (store: Omit<Store, 'id'>) => {
    if (!brandId) return;
    try {
      const created = await productsService.create({ ...store, brand_id: brandId } as any);
      setStores(prev => [...prev, { ...store, id: created.id }]);
    } catch (err) { console.error(err); }
  };

  const updateStore = async (id: string, store: Partial<Store>) => {
    try {
      // DataContext stores are read from BrandContext; delegate to BrandContext for store updates
      setStores(prev => prev.map(s => s.id === id ? { ...s, ...store } : s));
    } catch (err) { console.error(err); }
  };

  const deleteStore = (id: string) => {
    setStores(prev => prev.filter(s => s.id !== id));
  };

  const addCategory = async (category: Omit<Category, 'id'>) => {
    if (!brandId) return;
    try {
      const created = await categoriesService.create({ brand_id: brandId, name: category.name });
      setCategories(prev => [...prev, { id: created.id, name: created.name }]);
    } catch (err) { console.error(err); }
  };

  const deleteCategory = async (id: string) => {
    try {
      await categoriesService.delete(id);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (err) { console.error(err); }
  };

  const addProduct = async (product: Omit<Product, 'id'>) => {
    if (!brandId) return;
    try {
      const created = await productsService.create({
        brand_id: brandId, name: product.name, sku: product.sku,
        supplier_id: product.supplierId || null, category_id: product.categoryId || null,
        cost_price: product.costPrice, selling_price: product.sellingPrice,
        barcode: product.barcode, image_url: product.imageUrl ?? null, unit: product.unit || 'UN.',
      });
      setProducts(prev => [...prev, { ...product, id: created.id }]);
    } catch (err) { console.error(err); }
  };

  const updateProduct = async (id: string, product: Partial<Product>) => {
    try {
      const dbUpdate: any = {};
      if (product.name !== undefined) dbUpdate.name = product.name;
      if (product.sku !== undefined) dbUpdate.sku = product.sku;
      if (product.supplierId !== undefined) dbUpdate.supplier_id = product.supplierId || null;
      if (product.categoryId !== undefined) dbUpdate.category_id = product.categoryId || null;
      if (product.costPrice !== undefined) dbUpdate.cost_price = product.costPrice;
      if (product.sellingPrice !== undefined) dbUpdate.selling_price = product.sellingPrice;
      if (product.barcode !== undefined) dbUpdate.barcode = product.barcode;
      if (product.imageUrl !== undefined) dbUpdate.image_url = product.imageUrl;
      if (product.unit !== undefined) dbUpdate.unit = product.unit;
      await productsService.update(id, dbUpdate);
      setProducts(prev => prev.map(p => p.id === id ? { ...p, ...product } : p));
    } catch (err) { console.error(err); }
  };

  const deleteProduct = async (id: string) => {
    try {
      await productsService.delete(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) { console.error(err); }
  };

  const addInventoryItem = async (item: Omit<InventoryItem, 'id'>) => {
    if (!brandId) return;
    try {
      const created = await inventoryService.create({
        brand_id: brandId, store_id: item.storeId, product_id: item.productId,
        current_quantity: item.currentQuantity, min_quantity: item.minQuantity,
        alert_warning: item.alertWarning ?? null, alert_critical: item.alertCritical ?? null,
        last_updated: new Date().toISOString(),
      });
      setInventory(prev => [...prev, { ...item, id: created.id }]);
    } catch (err) { console.error(err); }
  };

  const updateInventoryItem = async (id: string, item: Partial<InventoryItem>) => {
    try {
      const dbUpdate: any = {};
      if (item.currentQuantity !== undefined) dbUpdate.current_quantity = item.currentQuantity;
      if (item.minQuantity !== undefined) dbUpdate.min_quantity = item.minQuantity;
      if (item.alertWarning !== undefined) dbUpdate.alert_warning = item.alertWarning;
      if (item.alertCritical !== undefined) dbUpdate.alert_critical = item.alertCritical;
      await inventoryService.update(id, dbUpdate);
      setInventory(prev => prev.map(i => i.id === id ? { ...i, ...item, lastUpdated: new Date() } : i));
    } catch (err) { console.error(err); }
  };

  const addCashRegister = async (cashRegister: Omit<CashRegister, 'id'>) => {
    if (!brandId) return;
    try {
      const created = await cashService.create({
        brand_id: brandId, store_id: cashRegister.storeId,
        opening_balance: cashRegister.openingBalance,
        closing_balance: cashRegister.closingBalance ?? null,
        opened_at: cashRegister.openedAt.toISOString(),
        closed_at: cashRegister.closedAt?.toISOString() ?? null,
        opened_by: cashRegister.openedBy, closed_by: cashRegister.closedBy ?? null,
        status: cashRegister.status,
      });
      setCashRegisters(prev => [...prev, { ...cashRegister, id: created.id }]);
    } catch (err) { console.error(err); }
  };

  const updateCashRegister = async (id: string, cashRegister: Partial<CashRegister>) => {
    try {
      const dbUpdate: any = {};
      if (cashRegister.closingBalance !== undefined) dbUpdate.closing_balance = cashRegister.closingBalance;
      if (cashRegister.closedAt !== undefined) dbUpdate.closed_at = cashRegister.closedAt?.toISOString() ?? null;
      if (cashRegister.closedBy !== undefined) dbUpdate.closed_by = cashRegister.closedBy;
      if (cashRegister.status !== undefined) dbUpdate.status = cashRegister.status;
      if (cashRegister.openingBalance !== undefined) dbUpdate.opening_balance = cashRegister.openingBalance;
      await cashService.update(id, dbUpdate);
      setCashRegisters(prev => prev.map(cr => cr.id === id ? { ...cr, ...cashRegister } : cr));
    } catch (err) { console.error(err); }
  };

  const addInvoice = async (invoice: Omit<Invoice, 'id'>) => {
    if (!brandId) return;
    try {
      const created = await invoicesService.create({
        brand_id: brandId, supplier_id: invoice.supplierId || null,
        invoice_number: invoice.invoiceNumber, amount: invoice.amount,
        status: invoice.status, issue_date: invoice.issueDate.toISOString(),
        due_date: invoice.dueDate.toISOString(),
        paid_date: invoice.paidDate?.toISOString() ?? null,
        store_id: invoice.storeId ?? null, description: invoice.description ?? null,
        order_number: invoice.orderNumber ?? null, cost_center: invoice.costCenter ?? null,
        currency: invoice.currency ?? 'EUR', direct_debit: invoice.directDebit ?? false,
        payment_method: invoice.paymentMethod ?? null,
        financial_institution: invoice.financialInstitution ?? null,
        observations: invoice.observations ?? [],
      });
      setInvoices(prev => [...prev, { ...invoice, id: created.id }]);
    } catch (err) { console.error(err); }
  };

  const updateInvoice = async (id: string, invoice: Partial<Invoice>) => {
    try {
      const dbUpdate: any = {};
      if (invoice.status !== undefined) dbUpdate.status = invoice.status;
      if (invoice.amount !== undefined) dbUpdate.amount = invoice.amount;
      if (invoice.paidDate !== undefined) dbUpdate.paid_date = invoice.paidDate?.toISOString() ?? null;
      if (invoice.observations !== undefined) dbUpdate.observations = invoice.observations;
      if (invoice.description !== undefined) dbUpdate.description = invoice.description;
      if (invoice.storeId !== undefined) dbUpdate.store_id = invoice.storeId;
      if (invoice.costCenter !== undefined) dbUpdate.cost_center = invoice.costCenter;
      if (invoice.paymentMethod !== undefined) dbUpdate.payment_method = invoice.paymentMethod;
      if (invoice.financialInstitution !== undefined) dbUpdate.financial_institution = invoice.financialInstitution;
      if (invoice.directDebit !== undefined) dbUpdate.direct_debit = invoice.directDebit;
      if (invoice.currency !== undefined) dbUpdate.currency = invoice.currency;
      if (invoice.invoiceNumber !== undefined) dbUpdate.invoice_number = invoice.invoiceNumber;
      if (invoice.orderNumber !== undefined) dbUpdate.order_number = invoice.orderNumber;
      await invoicesService.update(id, dbUpdate);
      setInvoices(prev => prev.map(i => i.id === id ? { ...i, ...invoice } : i));
    } catch (err) { console.error(err); }
  };

  const addSupplier = async (supplier: Omit<Supplier, 'id'>) => {
    if (!brandId) return;
    try {
      const created = await suppliersService.create({ brand_id: brandId, ...supplier });
      setSuppliers(prev => [...prev, { ...supplier, id: created.id }]);
    } catch (err) { console.error(err); }
  };

  const deleteSupplier = async (id: string) => {
    try {
      await suppliersService.delete(id);
      setSuppliers(prev => prev.filter(s => s.id !== id));
    } catch (err) { console.error(err); }
  };

  const addCostCenter = async (costCenter: Omit<CostCenter, 'id'>) => {
    if (!brandId) return;
    try {
      const created = await costCentersService.create({ brand_id: brandId, name: costCenter.name });
      setCostCenters(prev => [...prev, { id: created.id, name: created.name }]);
    } catch (err) { console.error(err); }
  };

  const deleteCostCenter = async (id: string) => {
    try {
      await costCentersService.delete(id);
      setCostCenters(prev => prev.filter(cc => cc.id !== id));
    } catch (err) { console.error(err); }
  };

  const addLicense = async (license: Omit<License, 'id'>) => {
    if (!brandId) return;
    try {
      const created = await licensesService.create({
        brand_id: brandId, name: license.name, store_ids: license.storeIds,
        description: license.description ?? null, periodicity: license.periodicity,
        alert_days: license.alertDays, status: license.status,
        renewals: license.renewals.map(r => ({
          ...r, issueDate: r.issueDate.toISOString(), renewalDate: r.renewalDate.toISOString(),
        })) as any,
        contacts: license.contacts as any, attachments: license.attachments.map(a => ({
          ...a, createdAt: a.createdAt.toISOString(), file: undefined,
        })) as any,
        observations: license.observations,
      });
      setLicenses(prev => [...prev, { ...license, id: created.id }]);
    } catch (err) { console.error(err); }
  };

  const updateLicense = async (id: string, license: Partial<License>) => {
    try {
      const dbUpdate: any = {};
      if (license.name !== undefined) dbUpdate.name = license.name;
      if (license.storeIds !== undefined) dbUpdate.store_ids = license.storeIds;
      if (license.description !== undefined) dbUpdate.description = license.description;
      if (license.periodicity !== undefined) dbUpdate.periodicity = license.periodicity;
      if (license.alertDays !== undefined) dbUpdate.alert_days = license.alertDays;
      if (license.status !== undefined) dbUpdate.status = license.status;
      if (license.renewals !== undefined) dbUpdate.renewals = license.renewals.map(r => ({
        ...r, issueDate: r.issueDate instanceof Date ? r.issueDate.toISOString() : r.issueDate,
        renewalDate: r.renewalDate instanceof Date ? r.renewalDate.toISOString() : r.renewalDate,
      }));
      if (license.contacts !== undefined) dbUpdate.contacts = license.contacts;
      if (license.attachments !== undefined) dbUpdate.attachments = license.attachments.map(a => ({
        ...a, createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : a.createdAt, file: undefined,
      }));
      if (license.observations !== undefined) dbUpdate.observations = license.observations;
      await licensesService.update(id, dbUpdate);
      setLicenses(prev => prev.map(l => l.id === id ? { ...l, ...license } : l));
    } catch (err) { console.error(err); }
  };

  const deleteLicense = async (id: string) => {
    try {
      await licensesService.delete(id);
      setLicenses(prev => prev.filter(l => l.id !== id));
    } catch (err) { console.error(err); }
  };

  const addWasteVariant = async (variant: Omit<WasteVariant, 'id'>) => {
    if (!brandId) return;
    try {
      const created = await wasteService.createVariant({ brand_id: brandId, name: variant.name, product_ids: variant.productIds });
      setWasteVariants(prev => [...prev, { ...variant, id: created.id }]);
    } catch (err) { console.error(err); }
  };

  const updateWasteVariant = async (id: string, variant: Partial<WasteVariant>) => {
    try {
      const dbUpdate: any = {};
      if (variant.name !== undefined) dbUpdate.name = variant.name;
      if (variant.productIds !== undefined) dbUpdate.product_ids = variant.productIds;
      await wasteService.updateVariant(id, dbUpdate);
      setWasteVariants(prev => prev.map(v => v.id === id ? { ...v, ...variant } : v));
    } catch (err) { console.error(err); }
  };

  const deleteWasteVariant = async (id: string) => {
    try {
      await wasteService.deleteVariant(id);
      setWasteVariants(prev => prev.filter(v => v.id !== id));
    } catch (err) { console.error(err); }
  };

  const addWasteReason = async (reason: Omit<WasteReason, 'id'>) => {
    if (!brandId) return;
    try {
      const created = await wasteService.createReason({ brand_id: brandId, name: reason.name });
      setWasteReasons(prev => [...prev, { id: created.id, name: created.name }]);
    } catch (err) { console.error(err); }
  };

  const updateWasteReason = async (id: string, reason: Partial<WasteReason>) => {
    try {
      if (reason.name !== undefined) await wasteService.updateReason(id, { name: reason.name });
      setWasteReasons(prev => prev.map(r => r.id === id ? { ...r, ...reason } : r));
    } catch (err) { console.error(err); }
  };

  const deleteWasteReason = async (id: string) => {
    try {
      await wasteService.deleteReason(id);
      setWasteReasons(prev => prev.filter(r => r.id !== id));
    } catch (err) { console.error(err); }
  };

  const addWasteRecord = async (record: Omit<WasteRecord, 'id'>) => {
    if (!brandId) return;
    try {
      const created = await wasteService.createRecord({
        brand_id: brandId, product_id: record.productId, variant_id: record.variantId || null,
        store_id: record.storeId, user_id: record.userId || null, user_name: record.userName,
        quantity: record.quantity, reason_id: record.reasonId || null,
        comment: record.comment ?? null, created_at: record.createdAt.toISOString(),
      });
      setWasteRecords(prev => [...prev, { ...record, id: created.id }]);
    } catch (err) { console.error(err); }
  };

  const deleteWasteRecord = async (id: string) => {
    try {
      await wasteService.deleteRecord(id);
      setWasteRecords(prev => prev.filter(r => r.id !== id));
    } catch (err) { console.error(err); }
  };

  const addChecklist = async (checklist: Omit<Checklist, 'id'>) => {
    if (!brandId) return;
    try {
      const created = await simpleChecklistsService.create({
        brand_id: brandId, store_id: checklist.storeId, type: checklist.type,
        tasks: checklist.tasks, completed_at: checklist.completedAt?.toISOString() ?? null,
        completed_by: checklist.completedBy ?? null,
      });
      setChecklists(prev => [...prev, { ...checklist, id: created.id }]);
    } catch (err) { console.error(err); }
  };

  const updateChecklist = async (id: string, checklist: Partial<Checklist>) => {
    try {
      const dbUpdate: any = {};
      if (checklist.tasks !== undefined) dbUpdate.tasks = checklist.tasks;
      if (checklist.completedAt !== undefined) dbUpdate.completed_at = checklist.completedAt?.toISOString() ?? null;
      if (checklist.completedBy !== undefined) dbUpdate.completed_by = checklist.completedBy;
      await simpleChecklistsService.update(id, dbUpdate);
      setChecklists(prev => prev.map(c => c.id === id ? { ...c, ...checklist } : c));
    } catch (err) { console.error(err); }
  };

  const addMovement = async (movement: Omit<InventoryMovement, 'id'>) => {
    if (!brandId) return;
    try {
      const created = await movementsService.create({
        brand_id: brandId, product_id: movement.productId,
        from_store_id: movement.fromStoreId ?? null, to_store_id: movement.toStoreId ?? null,
        quantity: movement.quantity, status: movement.status,
        user_id: movement.userId || null, type: movement.type,
        created_at: movement.createdAt.toISOString(),
      });
      setMovements(prev => [...prev, { ...movement, id: created.id }]);
    } catch (err) { console.error(err); }
  };

  const updateMovement = async (id: string, movement: Partial<InventoryMovement>) => {
    try {
      const dbUpdate: any = {};
      if (movement.status !== undefined) dbUpdate.status = movement.status;
      if (movement.quantity !== undefined) dbUpdate.quantity = movement.quantity;
      await movementsService.update(id, dbUpdate);
      setMovements(prev => prev.map(m => m.id === id ? { ...m, ...movement } : m));
    } catch (err) { console.error(err); }
  };

  const addOperationLog = async (log: Omit<OperationLog, 'id'>) => {
    if (!brandId) return;
    try {
      const created = await operationLogsService.create({
        brand_id: brandId, product_id: log.productId, store_id: log.storeId,
        user_id: log.userId || null, quantity: log.quantity,
        action_type: log.actionType, notes: log.notes ?? null,
        created_at: log.createdAt.toISOString(),
      });
      setOperationLogs(prev => [...prev, { ...log, id: created.id }]);
    } catch (err) { console.error(err); }
  };

  const getOperationLogsByProduct = (productId: string) =>
    operationLogs.filter(log => log.productId === productId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const addRecipe = async (recipe: Omit<Recipe, 'id'>) => {
    if (!brandId) return;
    try {
      const created = await recipesService.create({
        brand_id: brandId, name: recipe.name,
        final_product_id: recipe.finalProductId || null,
        ingredients: recipe.ingredients, expected_yield: recipe.expectedYield,
        is_active: recipe.isActive, created_at: recipe.createdAt.toISOString(),
      });
      setRecipes(prev => [...prev, { ...recipe, id: created.id }]);
    } catch (err) { console.error(err); }
  };

  const updateRecipe = async (id: string, recipe: Partial<Recipe>) => {
    try {
      const dbUpdate: any = {};
      if (recipe.name !== undefined) dbUpdate.name = recipe.name;
      if (recipe.finalProductId !== undefined) dbUpdate.final_product_id = recipe.finalProductId;
      if (recipe.ingredients !== undefined) dbUpdate.ingredients = recipe.ingredients;
      if (recipe.expectedYield !== undefined) dbUpdate.expected_yield = recipe.expectedYield;
      if (recipe.isActive !== undefined) dbUpdate.is_active = recipe.isActive;
      await recipesService.update(id, dbUpdate);
      setRecipes(prev => prev.map(r => r.id === id ? { ...r, ...recipe } : r));
    } catch (err) { console.error(err); }
  };

  const deleteRecipe = async (id: string) => {
    try {
      await recipesService.delete(id);
      setRecipes(prev => prev.filter(r => r.id !== id));
    } catch (err) { console.error(err); }
  };

  const addProductionRecord = async (record: Omit<ProductionRecord, 'id'>) => {
    if (!brandId) return;
    try {
      const created = await productionService.create({
        brand_id: brandId, recipe_id: record.recipeId || null, store_id: record.storeId,
        user_id: record.userId || null, actual_yield: record.actualYield,
        ingredients_used: record.ingredientsUsed, leftovers: record.leftovers,
        notes: record.notes ?? null, created_at: record.createdAt.toISOString(),
      });
      setProductionRecords(prev => [...prev, { ...record, id: created.id }]);
    } catch (err) { console.error(err); }
  };

  const getProductionRecordsByRecipe = (recipeId: string) =>
    productionRecords.filter(record => record.recipeId === recipeId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const addPurchaseOrder = async (order: Omit<PurchaseOrder, 'id'>) => {
    if (!brandId) return;
    try {
      const created = await purchaseOrdersService.create({
        brand_id: brandId, supplier_id: order.supplierId || null,
        user_id: order.userId || null, store_ids: order.storeIds, items: order.items,
        has_invoice_management: order.hasInvoiceManagement,
        has_transit_generated: order.hasTransitGenerated,
        invoice_id: order.invoiceId ?? null, observation: order.observation ?? null,
        created_at: order.createdAt.toISOString(),
      });
      setPurchaseOrders(prev => [...prev, { ...order, id: created.id }]);
    } catch (err) { console.error(err); }
  };

  const updatePurchaseOrder = async (id: string, order: Partial<PurchaseOrder>) => {
    try {
      const dbUpdate: any = {};
      if (order.items !== undefined) dbUpdate.items = order.items;
      if (order.storeIds !== undefined) dbUpdate.store_ids = order.storeIds;
      if (order.hasInvoiceManagement !== undefined) dbUpdate.has_invoice_management = order.hasInvoiceManagement;
      if (order.hasTransitGenerated !== undefined) dbUpdate.has_transit_generated = order.hasTransitGenerated;
      if (order.invoiceId !== undefined) dbUpdate.invoice_id = order.invoiceId;
      if (order.observation !== undefined) dbUpdate.observation = order.observation;
      await purchaseOrdersService.update(id, dbUpdate);
      setPurchaseOrders(prev => prev.map(o => o.id === id ? { ...o, ...order } : o));
    } catch (err) { console.error(err); }
  };

  const deletePurchaseOrder = async (id: string) => {
    try {
      await purchaseOrdersService.delete(id);
      setPurchaseOrders(prev => prev.filter(o => o.id !== id));
    } catch (err) { console.error(err); }
  };

  // Getters
  const getProductById = (id: string) => products.find(p => p.id === id);
  const getStoreById = (id: string) => stores.find(s => s.id === id);
  const getSupplierById = (id: string) => suppliers.find(s => s.id === id);
  const getCategoryById = (id: string) => categories.find(c => c.id === id);
  const getInventoryByStore = (storeId: string) => inventory.filter(i => i.storeId === storeId);
  const getLowStockItems = () => inventory.filter(i => i.currentQuantity <= i.minQuantity);
  const getOpenCashRegisters = () => cashRegisters.filter(cr => cr.status === 'open');
  const getOverdueInvoices = () => invoices.filter(i => i.status === 'contas_a_pagar');

  const value: DataContextType = {
    stores, categories, suppliers, products, inventory, cashRegisters, invoices, checklists,
    movements, operationLogs, recipes, productionRecords, purchaseOrders, costCenters,
    licenses, wasteVariants, wasteReasons, wasteRecords, dataLoading,
    addStore, updateStore, deleteStore, addCategory, deleteCategory,
    addProduct, updateProduct, deleteProduct, addInventoryItem, updateInventoryItem,
    addCashRegister, updateCashRegister, addInvoice, updateInvoice,
    addSupplier, deleteSupplier, addCostCenter, deleteCostCenter,
    addLicense, updateLicense, deleteLicense,
    addWasteVariant, updateWasteVariant, deleteWasteVariant,
    addWasteReason, updateWasteReason, deleteWasteReason,
    addWasteRecord, deleteWasteRecord,
    addChecklist, updateChecklist, addMovement, updateMovement,
    addOperationLog, getOperationLogsByProduct,
    addRecipe, updateRecipe, deleteRecipe,
    addProductionRecord, getProductionRecordsByRecipe,
    addPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder,
    getProductById, getStoreById, getSupplierById, getCategoryById,
    getInventoryByStore, getLowStockItems, getOpenCashRegisters, getOverdueInvoices,
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
