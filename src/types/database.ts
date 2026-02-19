export interface DbProfile {
  id: string;
  name: string;
  email: string;
  role: 'developer' | 'admin' | 'manager' | 'assistant';
  permissions: string[];
  pin: string | null;
  image_url: string | null;
  is_active: boolean;
  needs_password_change: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbBrand {
  id: string;
  name: string;
  logo_url: string;
  primary_color: string;
  stores_count: number;
  created_at: string;
}

export interface DbUserBrand {
  id: string;
  user_id: string;
  brand_id: string;
  role: 'admin' | 'manager' | 'operator';
  is_primary: boolean;
  created_at: string;
}

export interface DbStore {
  id: string;
  brand_id: string;
  name: string;
  address: string;
  contact: string;
  manager: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbCategory {
  id: string;
  brand_id: string;
  name: string;
  created_at: string;
}

export interface DbSupplier {
  id: string;
  brand_id: string;
  name: string;
  contact: string;
  email: string;
  created_at: string;
}

export interface DbProduct {
  id: string;
  brand_id: string;
  name: string;
  sku: string;
  supplier_id: string | null;
  category_id: string | null;
  cost_price: number;
  selling_price: number;
  barcode: string;
  image_url: string | null;
  unit: string;
  created_at: string;
}

export interface DbInventoryItem {
  id: string;
  brand_id: string;
  store_id: string;
  product_id: string;
  current_quantity: number;
  min_quantity: number;
  alert_warning: number | null;
  alert_critical: number | null;
  last_updated: string;
  created_at: string;
}

export interface DbCostCenter {
  id: string;
  brand_id: string;
  name: string;
  created_at: string;
}

export interface DbCashRegister {
  id: string;
  brand_id: string;
  store_id: string;
  opening_balance: number;
  closing_balance: number | null;
  opened_at: string;
  closed_at: string | null;
  opened_by: string;
  closed_by: string | null;
  status: 'open' | 'closed';
  created_at: string;
}

export interface DbInvoice {
  id: string;
  brand_id: string;
  supplier_id: string | null;
  invoice_number: string;
  amount: number;
  status: 'pedido_realizado' | 'mercadoria_recebida' | 'contas_a_pagar' | 'finalizado_pago' | 'cancelado' | 'finalizado_outros';
  issue_date: string;
  due_date: string | null;
  paid_date: string | null;
  store_id: string | null;
  description: string | null;
  order_number: string | null;
  cost_center: string | null;
  currency: string;
  direct_debit: boolean;
  payment_method: string | null;
  financial_institution: string | null;
  observations: Array<{ user: string; text: string; date: string }>;
  created_at: string;
}

export interface DbInventoryMovement {
  id: string;
  brand_id: string;
  product_id: string;
  from_store_id: string | null;
  to_store_id: string | null;
  quantity: number;
  status: 'pending' | 'in_transit' | 'delivered';
  user_id: string | null;
  type: 'in' | 'out' | 'transfer';
  created_at: string;
}

export interface DbOperationLog {
  id: string;
  brand_id: string;
  product_id: string;
  store_id: string;
  user_id: string | null;
  quantity: number;
  action_type: 'withdrawal' | 'entry';
  notes: string | null;
  created_at: string;
}

export interface DbPurchaseOrder {
  id: string;
  brand_id: string;
  supplier_id: string | null;
  user_id: string | null;
  store_ids: string[];
  items: Array<{ productId: string; storeId: string; unit: string; quantity: number }>;
  has_invoice_management: boolean;
  has_transit_generated: boolean;
  invoice_id: string | null;
  observation: string | null;
  created_at: string;
}

export interface DbRecipe {
  id: string;
  brand_id: string;
  name: string;
  final_product_id: string | null;
  ingredients: Array<{ productId: string; quantity: number }>;
  expected_yield: number;
  is_active: boolean;
  created_at: string;
}

export interface DbProductionRecord {
  id: string;
  brand_id: string;
  recipe_id: string | null;
  store_id: string;
  user_id: string | null;
  actual_yield: number;
  ingredients_used: Array<{ productId: string; quantity: number }>;
  leftovers: Array<{ productId: string; quantity: number; destination: string }>;
  notes: string | null;
  created_at: string;
}

export interface DbWasteVariant {
  id: string;
  brand_id: string;
  name: string;
  product_ids: string[];
  created_at: string;
}

export interface DbWasteReason {
  id: string;
  brand_id: string;
  name: string;
  created_at: string;
}

export interface DbWasteRecord {
  id: string;
  brand_id: string;
  product_id: string;
  variant_id: string | null;
  store_id: string;
  user_id: string | null;
  user_name: string;
  quantity: number;
  reason_id: string | null;
  comment: string | null;
  created_at: string;
}

export interface DbChecklistTemplate {
  id: string;
  brand_id: string;
  name: string;
  description: string;
  type: 'opening' | 'closing' | 'quality' | 'maintenance';
  items: Array<{
    id: string;
    question: string;
    description?: string;
    isRequired: boolean;
    requiresComment: boolean;
    requiresImage: boolean;
    applicableStores: string[];
    applicableDays: number[];
  }>;
  associated_stores: string[];
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  is_active: boolean;
  usage_count: number;
  created_at: string;
  last_edited_at: string;
}

export interface DbChecklistExecution {
  id: string;
  brand_id: string;
  template_id: string | null;
  template_name: string;
  store_id: string;
  user_id: string | null;
  start_time: string;
  end_time: string | null;
  status: 'draft' | 'in_progress' | 'completed';
  responses: Array<{
    itemId: string;
    response: boolean | null;
    comment?: string;
    imageUrl?: string;
    skipped: boolean;
    completedAt?: string;
  }>;
  current_item_index: number;
  created_at: string;
}

export interface DbChecklistHistory {
  id: string;
  brand_id: string;
  template_name: string;
  type: string;
  store_name: string;
  user_name: string;
  start_time: string;
  end_time: string;
  duration: number;
  total_items: number;
  completed_items: number;
  responses: Array<{
    itemId: string;
    response: boolean | null;
    comment?: string;
    imageUrl?: string;
    skipped: boolean;
    completedAt?: string;
  }>;
  created_at: string;
}

export interface DbLicense {
  id: string;
  brand_id: string;
  name: string;
  store_ids: string[];
  description: string | null;
  periodicity: 'mensal' | 'trimestral' | 'semestral' | 'anual';
  alert_days: number;
  status: 'ativa' | 'expirada' | 'cancelada' | 'pendente';
  renewals: Array<{ id: string; issueDate: string; renewalDate: string; value: number; currency: string }>;
  contacts: Array<{ id: string; name: string; phone?: string; email?: string }>;
  attachments: Array<{ id: string; description: string; createdAt: string; fileName?: string }>;
  observations: Array<{ user: string; text: string; date: string }>;
  created_at: string;
}

export interface DbChecklist {
  id: string;
  brand_id: string;
  store_id: string;
  type: 'opening' | 'closing' | 'quality';
  tasks: Array<{ id: string; taskName: string; isCompleted: boolean }>;
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
}
