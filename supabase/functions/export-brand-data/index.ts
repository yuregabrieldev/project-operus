import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  BACKUP_APP_NAME,
  BACKUP_TABLE_COLUMNS,
  BACKUP_VERSION,
  BRAND_BACKUP_TABLES,
  type BackupTableName,
  type BrandBackupFile,
  emptyPayload,
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
    return { error: `Forbidden: your role (${profile.role}) cannot export backup` };
  }

  return { adminClient, user };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const auth = await getCallerInfo(req);
    if ('error' in auth) return jsonResponse({ error: auth.error }, auth.error === 'Unauthorized' ? 401 : 403);
    const { adminClient } = auth;

    const body = await req.json().catch(() => ({}));
    const brandId = body?.brandId as string | undefined;
    if (!brandId) return jsonResponse({ error: 'Missing brandId' }, 400);

    const payload = emptyPayload();
    for (const tableName of BRAND_BACKUP_TABLES) {
      const columns = BACKUP_TABLE_COLUMNS[tableName].join(', ');
      const { data, error } = await adminClient
        .from(tableName)
        .select(columns)
        .eq('brand_id', brandId);

      if (error) {
        return jsonResponse({ error: `Failed to export ${tableName}: ${error.message}` }, 400);
      }
      payload[tableName as BackupTableName] = (data ?? []) as Record<string, unknown>[];
    }

    const backup: BrandBackupFile = {
      meta: {
        version: BACKUP_VERSION,
        exportedAt: new Date().toISOString(),
        brandId,
        app: BACKUP_APP_NAME,
      },
      payload,
    };

    return jsonResponse({ backup }, 200);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return jsonResponse({ error: message }, 500);
  }
});

