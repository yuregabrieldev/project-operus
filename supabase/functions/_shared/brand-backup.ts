export type BackupVersion = '1.0';

export interface BrandBackupMeta {
  version: BackupVersion;
  exportedAt: string;
  brandId: string;
  app: string;
}

export interface BrandBackupPayload {
  stores: Record<string, unknown>[];
  categories: Record<string, unknown>[];
  suppliers: Record<string, unknown>[];
  products: Record<string, unknown>[];
  inventory_items: Record<string, unknown>[];
  cost_centers: Record<string, unknown>[];
  cash_registers: Record<string, unknown>[];
  invoices: Record<string, unknown>[];
  inventory_movements: Record<string, unknown>[];
  operation_logs: Record<string, unknown>[];
  purchase_orders: Record<string, unknown>[];
  recipes: Record<string, unknown>[];
  production_records: Record<string, unknown>[];
  waste_variants: Record<string, unknown>[];
  waste_reasons: Record<string, unknown>[];
  waste_records: Record<string, unknown>[];
  checklist_templates: Record<string, unknown>[];
  checklist_executions: Record<string, unknown>[];
  checklist_history: Record<string, unknown>[];
  checklists: Record<string, unknown>[];
  licenses: Record<string, unknown>[];
}

export interface BrandBackupFile {
  meta: BrandBackupMeta;
  payload: BrandBackupPayload;
}

export const BACKUP_VERSION: BackupVersion = '1.0';
export const BACKUP_APP_NAME = 'operus-backup';

export const BRAND_BACKUP_TABLES = [
  'stores',
  'categories',
  'suppliers',
  'products',
  'inventory_items',
  'cost_centers',
  'cash_registers',
  'invoices',
  'inventory_movements',
  'operation_logs',
  'purchase_orders',
  'recipes',
  'production_records',
  'waste_variants',
  'waste_reasons',
  'waste_records',
  'checklist_templates',
  'checklist_executions',
  'checklist_history',
  'checklists',
  'licenses',
] as const;

export type BackupTableName = (typeof BRAND_BACKUP_TABLES)[number];

export const BACKUP_TABLE_COLUMNS: Record<BackupTableName, string[]> = {
  stores: ['id', 'brand_id', 'name', 'address', 'contact', 'manager', 'is_active', 'image_url', 'plan', 'plan_value'],
  categories: ['id', 'brand_id', 'name'],
  suppliers: ['id', 'brand_id', 'name', 'contact', 'email'],
  products: ['id', 'brand_id', 'name', 'sku', 'supplier_id', 'category_id', 'cost_price', 'selling_price', 'barcode', 'image_url', 'unit'],
  inventory_items: ['id', 'brand_id', 'store_id', 'product_id', 'current_quantity', 'min_quantity', 'alert_warning', 'alert_critical', 'last_updated'],
  cost_centers: ['id', 'brand_id', 'name'],
  cash_registers: ['id', 'brand_id', 'store_id', 'opening_balance', 'closing_balance', 'opened_at', 'closed_at', 'opened_by', 'closed_by', 'status', 'deposited', 'closure_details'],
  invoices: ['id', 'brand_id', 'supplier_id', 'invoice_number', 'amount', 'status', 'issue_date', 'due_date', 'paid_date', 'store_id', 'description', 'order_number', 'cost_center', 'currency', 'direct_debit', 'payment_method', 'financial_institution', 'observations'],
  inventory_movements: ['id', 'brand_id', 'product_id', 'from_store_id', 'to_store_id', 'quantity', 'status', 'user_id', 'type', 'created_at'],
  operation_logs: ['id', 'brand_id', 'product_id', 'store_id', 'user_id', 'quantity', 'action_type', 'notes', 'created_at'],
  purchase_orders: ['id', 'brand_id', 'supplier_id', 'user_id', 'store_ids', 'items', 'has_invoice_management', 'has_transit_generated', 'invoice_id', 'observation'],
  recipes: ['id', 'brand_id', 'name', 'final_product_id', 'ingredients', 'expected_yield', 'is_active'],
  production_records: ['id', 'brand_id', 'recipe_id', 'store_id', 'user_id', 'actual_yield', 'ingredients_used', 'leftovers', 'notes', 'created_at'],
  waste_variants: ['id', 'brand_id', 'name', 'product_ids'],
  waste_reasons: ['id', 'brand_id', 'name'],
  waste_records: ['id', 'brand_id', 'product_id', 'variant_id', 'store_id', 'user_id', 'user_name', 'quantity', 'reason_id', 'comment', 'created_at'],
  checklist_templates: ['id', 'brand_id', 'name', 'description', 'type', 'items', 'associated_stores', 'frequency', 'is_active', 'usage_count', 'last_edited_at'],
  checklist_executions: ['id', 'brand_id', 'template_id', 'template_name', 'store_id', 'user_id', 'start_time', 'end_time', 'status', 'responses', 'current_item_index'],
  checklist_history: ['id', 'brand_id', 'template_name', 'type', 'store_name', 'user_name', 'start_time', 'end_time', 'duration', 'total_items', 'completed_items', 'responses'],
  checklists: ['id', 'brand_id', 'store_id', 'type', 'tasks', 'completed_at', 'completed_by'],
  licenses: ['id', 'brand_id', 'name', 'store_ids', 'description', 'periodicity', 'alert_days', 'status', 'renewals', 'contacts', 'attachments', 'observations'],
};

export function emptyPayload(): BrandBackupPayload {
  return {
    stores: [],
    categories: [],
    suppliers: [],
    products: [],
    inventory_items: [],
    cost_centers: [],
    cash_registers: [],
    invoices: [],
    inventory_movements: [],
    operation_logs: [],
    purchase_orders: [],
    recipes: [],
    production_records: [],
    waste_variants: [],
    waste_reasons: [],
    waste_records: [],
    checklist_templates: [],
    checklist_executions: [],
    checklist_history: [],
    checklists: [],
    licenses: [],
  };
}

