import { supabase } from './supabase';
import type {
  DbProfile, DbBrand, DbUserBrand, DbStore, DbCategory, DbSupplier,
  DbProduct, DbInventoryItem, DbCostCenter, DbCashRegister, DbInvoice,
  DbInventoryMovement, DbOperationLog, DbPurchaseOrder, DbRecipe,
  DbProductionRecord, DbWasteVariant, DbWasteReason, DbWasteRecord,
  DbChecklistTemplate, DbChecklistExecution, DbChecklistHistory,
  DbLicense, DbChecklist,
} from '@/types/database';

function throwIfError<T>(result: { data: T | null; error: any }): T {
  if (result.error) throw result.error;
  return result.data as T;
}

// ============================================================
// AUTH SERVICE
// ============================================================
export const authService = {
  signIn: (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password }),

  signUp: (email: string, password: string, meta?: { name?: string; role?: string }) =>
    supabase.auth.signUp({
      email,
      password,
      options: { data: meta },
    }),

  signOut: () => supabase.auth.signOut(),

  updatePassword: (newPassword: string) =>
    supabase.auth.updateUser({ password: newPassword }),

  getSession: () => supabase.auth.getSession(),

  onAuthStateChange: (cb: Parameters<typeof supabase.auth.onAuthStateChange>[0]) =>
    supabase.auth.onAuthStateChange(cb),

  getProfile: async (userId: string): Promise<DbProfile | null> => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return data;
  },

  updateProfile: async (userId: string, updates: Partial<DbProfile>) => {
    return throwIfError(
      await supabase.from('profiles').update(updates).eq('id', userId).select().single()
    );
  },
};

// ============================================================
// BRANDS SERVICE
// ============================================================
export const brandsService = {
  getUserBrands: async (userId: string): Promise<DbBrand[]> => {
    const { data: ubRows } = await supabase
      .from('user_brands')
      .select('brand_id')
      .eq('user_id', userId);
    if (!ubRows || ubRows.length === 0) return [];
    const brandIds = ubRows.map((r: any) => r.brand_id);
    const { data } = await supabase.from('brands').select('*').in('id', brandIds);
    return data ?? [];
  },

  createBrand: async (brand: Omit<DbBrand, 'id' | 'created_at' | 'stores_count'>, userId: string) => {
    const created = throwIfError(
      await supabase.from('brands').insert(brand).select().single()
    ) as DbBrand;
    await supabase.from('user_brands').insert({
      user_id: userId,
      brand_id: created.id,
      role: 'admin',
      is_primary: true,
    });
    return created;
  },

  updateBrand: async (id: string, updates: Partial<DbBrand>) => {
    return throwIfError(
      await supabase.from('brands').update(updates).eq('id', id).select().single()
    );
  },
};

// ============================================================
// STORES SERVICE
// ============================================================
export const storesService = {
  getByBrand: async (brandId: string): Promise<DbStore[]> => {
    const { data } = await supabase
      .from('stores')
      .select('*')
      .eq('brand_id', brandId)
      .order('created_at');
    return data ?? [];
  },

  create: async (store: Omit<DbStore, 'id' | 'created_at' | 'updated_at'>) => {
    return throwIfError(
      await supabase.from('stores').insert(store).select().single()
    ) as DbStore;
  },

  update: async (id: string, updates: Partial<DbStore>) => {
    return throwIfError(
      await supabase.from('stores').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single()
    ) as DbStore;
  },

  toggleStatus: async (id: string, currentStatus: boolean) => {
    return throwIfError(
      await supabase.from('stores').update({ is_active: !currentStatus, updated_at: new Date().toISOString() }).eq('id', id).select().single()
    ) as DbStore;
  },
};

// ============================================================
// GENERIC BRAND-SCOPED CRUD HELPERS
// ============================================================
async function fetchAll<T>(table: string, brandId: string, orderBy = 'created_at'): Promise<T[]> {
  const { data } = await supabase.from(table).select('*').eq('brand_id', brandId).order(orderBy);
  return (data ?? []) as T[];
}

async function insertOne<T>(table: string, row: any): Promise<T> {
  return throwIfError(await supabase.from(table).insert(row).select().single()) as T;
}

async function updateOne<T>(table: string, id: string, updates: any): Promise<T> {
  return throwIfError(await supabase.from(table).update(updates).eq('id', id).select().single()) as T;
}

async function deleteOne(table: string, id: string): Promise<void> {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
}

// ============================================================
// CATEGORIES SERVICE
// ============================================================
export const categoriesService = {
  getByBrand: (brandId: string) => fetchAll<DbCategory>('categories', brandId),
  create: (cat: Omit<DbCategory, 'id' | 'created_at'>) => insertOne<DbCategory>('categories', cat),
  delete: (id: string) => deleteOne('categories', id),
};

// ============================================================
// SUPPLIERS SERVICE
// ============================================================
export const suppliersService = {
  getByBrand: (brandId: string) => fetchAll<DbSupplier>('suppliers', brandId),
  create: (s: Omit<DbSupplier, 'id' | 'created_at'>) => insertOne<DbSupplier>('suppliers', s),
  delete: (id: string) => deleteOne('suppliers', id),
};

// ============================================================
// PRODUCTS SERVICE
// ============================================================
export const productsService = {
  getByBrand: (brandId: string) => fetchAll<DbProduct>('products', brandId),
  create: (p: Omit<DbProduct, 'id' | 'created_at'>) => insertOne<DbProduct>('products', p),
  update: (id: string, p: Partial<DbProduct>) => updateOne<DbProduct>('products', id, p),
  delete: (id: string) => deleteOne('products', id),
};

// ============================================================
// INVENTORY SERVICE
// ============================================================
export const inventoryService = {
  getByBrand: (brandId: string) => fetchAll<DbInventoryItem>('inventory_items', brandId, 'last_updated'),
  create: (item: Omit<DbInventoryItem, 'id' | 'created_at'>) => insertOne<DbInventoryItem>('inventory_items', item),
  update: (id: string, updates: Partial<DbInventoryItem>) =>
    updateOne<DbInventoryItem>('inventory_items', id, { ...updates, last_updated: new Date().toISOString() }),
};

// ============================================================
// COST CENTERS SERVICE
// ============================================================
export const costCentersService = {
  getByBrand: (brandId: string) => fetchAll<DbCostCenter>('cost_centers', brandId),
  create: (cc: Omit<DbCostCenter, 'id' | 'created_at'>) => insertOne<DbCostCenter>('cost_centers', cc),
  delete: (id: string) => deleteOne('cost_centers', id),
};

// ============================================================
// CASH REGISTERS SERVICE
// ============================================================
export const cashService = {
  getByBrand: (brandId: string) => fetchAll<DbCashRegister>('cash_registers', brandId),
  create: (cr: Omit<DbCashRegister, 'id' | 'created_at'>) => insertOne<DbCashRegister>('cash_registers', cr),
  update: (id: string, updates: Partial<DbCashRegister>) => updateOne<DbCashRegister>('cash_registers', id, updates),
};

// ============================================================
// INVOICES SERVICE
// ============================================================
export const invoicesService = {
  getByBrand: (brandId: string) => fetchAll<DbInvoice>('invoices', brandId),
  create: (inv: Omit<DbInvoice, 'id' | 'created_at'>) => insertOne<DbInvoice>('invoices', inv),
  update: (id: string, updates: Partial<DbInvoice>) => updateOne<DbInvoice>('invoices', id, updates),
};

// ============================================================
// INVENTORY MOVEMENTS SERVICE
// ============================================================
export const movementsService = {
  getByBrand: (brandId: string) => fetchAll<DbInventoryMovement>('inventory_movements', brandId),
  create: (m: Omit<DbInventoryMovement, 'id'>) => insertOne<DbInventoryMovement>('inventory_movements', m),
  update: (id: string, updates: Partial<DbInventoryMovement>) => updateOne<DbInventoryMovement>('inventory_movements', id, updates),
};

// ============================================================
// OPERATION LOGS SERVICE
// ============================================================
export const operationLogsService = {
  getByBrand: (brandId: string) => fetchAll<DbOperationLog>('operation_logs', brandId),
  create: (log: Omit<DbOperationLog, 'id'>) => insertOne<DbOperationLog>('operation_logs', log),
};

// ============================================================
// PURCHASE ORDERS SERVICE
// ============================================================
export const purchaseOrdersService = {
  getByBrand: (brandId: string) => fetchAll<DbPurchaseOrder>('purchase_orders', brandId),
  create: (po: Omit<DbPurchaseOrder, 'id'>) => insertOne<DbPurchaseOrder>('purchase_orders', po),
  update: (id: string, updates: Partial<DbPurchaseOrder>) => updateOne<DbPurchaseOrder>('purchase_orders', id, updates),
  delete: (id: string) => deleteOne('purchase_orders', id),
};

// ============================================================
// RECIPES SERVICE
// ============================================================
export const recipesService = {
  getByBrand: (brandId: string) => fetchAll<DbRecipe>('recipes', brandId),
  create: (r: Omit<DbRecipe, 'id'>) => insertOne<DbRecipe>('recipes', r),
  update: (id: string, updates: Partial<DbRecipe>) => updateOne<DbRecipe>('recipes', id, updates),
  delete: (id: string) => deleteOne('recipes', id),
};

// ============================================================
// PRODUCTION RECORDS SERVICE
// ============================================================
export const productionService = {
  getByBrand: (brandId: string) => fetchAll<DbProductionRecord>('production_records', brandId),
  create: (r: Omit<DbProductionRecord, 'id'>) => insertOne<DbProductionRecord>('production_records', r),
};

// ============================================================
// WASTE SERVICE
// ============================================================
export const wasteService = {
  getVariants: (brandId: string) => fetchAll<DbWasteVariant>('waste_variants', brandId),
  createVariant: (v: Omit<DbWasteVariant, 'id' | 'created_at'>) => insertOne<DbWasteVariant>('waste_variants', v),
  updateVariant: (id: string, updates: Partial<DbWasteVariant>) => updateOne<DbWasteVariant>('waste_variants', id, updates),
  deleteVariant: (id: string) => deleteOne('waste_variants', id),

  getReasons: (brandId: string) => fetchAll<DbWasteReason>('waste_reasons', brandId),
  createReason: (r: Omit<DbWasteReason, 'id' | 'created_at'>) => insertOne<DbWasteReason>('waste_reasons', r),
  updateReason: (id: string, updates: Partial<DbWasteReason>) => updateOne<DbWasteReason>('waste_reasons', id, updates),
  deleteReason: (id: string) => deleteOne('waste_reasons', id),

  getRecords: (brandId: string) => fetchAll<DbWasteRecord>('waste_records', brandId),
  createRecord: (r: Omit<DbWasteRecord, 'id'>) => insertOne<DbWasteRecord>('waste_records', r),
  deleteRecord: (id: string) => deleteOne('waste_records', id),
};

// ============================================================
// CHECKLIST SERVICE
// ============================================================
export const checklistService = {
  getTemplates: (brandId: string) => fetchAll<DbChecklistTemplate>('checklist_templates', brandId),
  createTemplate: (t: Omit<DbChecklistTemplate, 'id' | 'created_at' | 'last_edited_at' | 'usage_count'>) =>
    insertOne<DbChecklistTemplate>('checklist_templates', { ...t, usage_count: 0 }),
  updateTemplate: (id: string, updates: Partial<DbChecklistTemplate>) =>
    updateOne<DbChecklistTemplate>('checklist_templates', id, { ...updates, last_edited_at: new Date().toISOString() }),
  deleteTemplate: (id: string) => deleteOne('checklist_templates', id),

  getExecutions: (brandId: string) => fetchAll<DbChecklistExecution>('checklist_executions', brandId),
  createExecution: (e: Omit<DbChecklistExecution, 'id' | 'created_at'>) =>
    insertOne<DbChecklistExecution>('checklist_executions', e),
  updateExecution: (id: string, updates: Partial<DbChecklistExecution>) =>
    updateOne<DbChecklistExecution>('checklist_executions', id, updates),
  deleteExecution: (id: string) => deleteOne('checklist_executions', id),

  getHistory: (brandId: string) => fetchAll<DbChecklistHistory>('checklist_history', brandId),
  addToHistory: (h: Omit<DbChecklistHistory, 'id' | 'created_at'>) =>
    insertOne<DbChecklistHistory>('checklist_history', h),
};

// ============================================================
// LICENSES SERVICE
// ============================================================
export const licensesService = {
  getByBrand: (brandId: string) => fetchAll<DbLicense>('licenses', brandId),
  create: (l: Omit<DbLicense, 'id' | 'created_at'>) => insertOne<DbLicense>('licenses', l),
  update: (id: string, updates: Partial<DbLicense>) => updateOne<DbLicense>('licenses', id, updates),
  delete: (id: string) => deleteOne('licenses', id),
};

// ============================================================
// SIMPLE CHECKLISTS SERVICE (from DataContext)
// ============================================================
export const simpleChecklistsService = {
  getByBrand: (brandId: string) => fetchAll<DbChecklist>('checklists', brandId),
  create: (c: Omit<DbChecklist, 'id' | 'created_at'>) => insertOne<DbChecklist>('checklists', c),
  update: (id: string, updates: Partial<DbChecklist>) => updateOne<DbChecklist>('checklists', id, updates),
};

// ============================================================
// USER MANAGEMENT SERVICE
// ============================================================
export const usersService = {
  getByBrand: async (brandId: string): Promise<(DbProfile & { brand_role: string })[]> => {
    const { data: ubRows } = await supabase
      .from('user_brands')
      .select('user_id, role')
      .eq('brand_id', brandId);
    if (!ubRows || ubRows.length === 0) return [];
    const userIds = ubRows.map((r: any) => r.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds);
    return (profiles ?? []).map((p: any) => ({
      ...p,
      brand_role: ubRows.find((u: any) => u.user_id === p.id)?.role ?? 'operator',
    }));
  },

  updateProfile: async (id: string, updates: Partial<DbProfile>) => {
    return throwIfError(
      await supabase.from('profiles').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single()
    );
  },

  addUserToBrand: async (userId: string, brandId: string, role = 'operator') => {
    return throwIfError(
      await supabase.from('user_brands').insert({ user_id: userId, brand_id: brandId, role }).select().single()
    );
  },

  removeUserFromBrand: async (userId: string, brandId: string) => {
    const { error } = await supabase.from('user_brands').delete().eq('user_id', userId).eq('brand_id', brandId);
    if (error) throw error;
  },
};
