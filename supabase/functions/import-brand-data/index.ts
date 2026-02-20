import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  BACKUP_APP_NAME,
  BACKUP_VERSION,
  type BrandBackupFile,
  type BackupTableName,
} from '../_shared/brand-backup.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

type TableReport = { created: number; updated: number; skipped: number; errors: string[] };
type ImportReport = Record<BackupTableName, TableReport>;

const TABLE_ORDER: BackupTableName[] = [
  'stores',
  'categories',
  'suppliers',
  'cost_centers',
  'waste_reasons',
  'waste_variants',
  'products',
  'licenses',
  'recipes',
  'inventory_items',
  'checklist_templates',
  'checklists',
  'invoices',
  'purchase_orders',
  'cash_registers',
  'inventory_movements',
  'operation_logs',
  'production_records',
  'waste_records',
  'checklist_executions',
  'checklist_history',
];

function emptyReport(): ImportReport {
  const base = { created: 0, updated: 0, skipped: 0, errors: [] as string[] };
  return {
    stores: { ...base, errors: [] },
    categories: { ...base, errors: [] },
    suppliers: { ...base, errors: [] },
    products: { ...base, errors: [] },
    inventory_items: { ...base, errors: [] },
    cost_centers: { ...base, errors: [] },
    cash_registers: { ...base, errors: [] },
    invoices: { ...base, errors: [] },
    inventory_movements: { ...base, errors: [] },
    operation_logs: { ...base, errors: [] },
    purchase_orders: { ...base, errors: [] },
    recipes: { ...base, errors: [] },
    production_records: { ...base, errors: [] },
    waste_variants: { ...base, errors: [] },
    waste_reasons: { ...base, errors: [] },
    waste_records: { ...base, errors: [] },
    checklist_templates: { ...base, errors: [] },
    checklist_executions: { ...base, errors: [] },
    checklist_history: { ...base, errors: [] },
    checklists: { ...base, errors: [] },
    licenses: { ...base, errors: [] },
  };
}

async function getCallerInfo(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return { error: 'Missing authorization header' };

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  const callerClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: { user }, error: userError } = await callerClient.auth.getUser(token);
  if (userError || !user) return { error: 'Unauthorized' };

  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) return { error: 'Could not verify permissions' };
  if (!['admin', 'developer'].includes(profile.role)) {
    return { error: `Forbidden: your role (${profile.role}) cannot import backup` };
  }

  return { adminClient, user };
}

function sanitizeRow(table: BackupTableName, row: Record<string, unknown>, brandId: string, fallbackUserId: string): Record<string, unknown> {
  const next = { ...row, brand_id: brandId };

  if (table === 'cash_registers') {
    next.opened_by = typeof row.opened_by === 'string' && row.opened_by ? row.opened_by : fallbackUserId;
    if (row.closed_by === '') next.closed_by = null;
  }
  if (table === 'checklists' && row.completed_by === '') next.completed_by = null;
  if (table === 'inventory_movements' && row.user_id === '') next.user_id = null;
  if (table === 'operation_logs' && row.user_id === '') next.user_id = null;
  if (table === 'purchase_orders' && row.user_id === '') next.user_id = null;
  if (table === 'production_records' && row.user_id === '') next.user_id = null;
  if (table === 'waste_records' && row.user_id === '') next.user_id = null;
  if (table === 'checklist_executions' && row.user_id === '') next.user_id = null;

  return next;
}

async function upsertRows(
  adminClient: ReturnType<typeof createClient>,
  table: BackupTableName,
  rows: Record<string, unknown>[],
  brandId: string,
  fallbackUserId: string,
  report: ImportReport,
) {
  if (!Array.isArray(rows) || rows.length === 0) return;

  for (const rawRow of rows) {
    const row = sanitizeRow(table, rawRow, brandId, fallbackUserId);
    const id = row.id as string | undefined;
    if (!id) {
      report[table].skipped += 1;
      continue;
    }

    const { data: existing, error: existsError } = await adminClient
      .from(table)
      .select('id')
      .eq('id', id)
      .maybeSingle();
    if (existsError) {
      report[table].errors.push(`check id ${id}: ${existsError.message}`);
      continue;
    }

    const { error } = await adminClient
      .from(table)
      .upsert(row, { onConflict: 'id' });
    if (error) {
      report[table].errors.push(`id ${id}: ${error.message}`);
      continue;
    }

    if (existing?.id) report[table].updated += 1;
    else report[table].created += 1;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const auth = await getCallerInfo(req);
    if ('error' in auth) return jsonResponse({ error: auth.error }, auth.error === 'Unauthorized' ? 401 : 403);
    const { adminClient, user } = auth;

    const body = await req.json().catch(() => ({}));
    const targetBrandId = body?.brandId as string | undefined;
    const backup = body?.backup as BrandBackupFile | undefined;
    if (!targetBrandId || !backup) {
      return jsonResponse({ error: 'Missing required fields: brandId, backup' }, 400);
    }

    if (!backup.meta || backup.meta.version !== BACKUP_VERSION) {
      return jsonResponse({ error: `Unsupported backup version. Expected ${BACKUP_VERSION}` }, 400);
    }
    if (backup.meta.app !== BACKUP_APP_NAME) {
      return jsonResponse({ error: 'Invalid backup file source' }, 400);
    }
    if (backup.meta.brandId !== targetBrandId) {
      return jsonResponse({ error: 'Backup brand does not match selected brand' }, 400);
    }
    if (!backup.payload) {
      return jsonResponse({ error: 'Backup file missing payload' }, 400);
    }

    const report = emptyReport();
    for (const tableName of TABLE_ORDER) {
      const rows = (backup.payload as Record<string, Record<string, unknown>[]>)[tableName] ?? [];
      await upsertRows(adminClient, tableName, rows, targetBrandId, user.id, report);
    }

    return jsonResponse({ ok: true, report }, 200);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return jsonResponse({ error: message }, 500);
  }
});

