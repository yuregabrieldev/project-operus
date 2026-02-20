import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization header' }, 401);
    }

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
    const { data: { user: callerUser }, error: sessionError } = await callerClient.auth.getUser(token);
    if (sessionError || !callerUser) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const { data: callerProfile, error: profileError } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', callerUser.id)
      .single();
    if (profileError || !callerProfile) {
      return jsonResponse({ error: 'Could not verify permissions' }, 403);
    }
    if (!['developer', 'admin', 'manager'].includes(callerProfile.role)) {
      return jsonResponse({ error: `Forbidden: your role (${callerProfile.role}) cannot update users` }, 403);
    }

    const body = await req.json();
    const { userId, name, email, role, isActive, brandId, storeId } = body;
    if (!userId || !name || !email || !role || typeof isActive !== 'boolean') {
      return jsonResponse({ error: 'Missing required fields: userId, name, email, role, isActive' }, 400);
    }

    const allowedTargetRoles = ['assistant', 'manager', 'admin'] as const;
    if (!allowedTargetRoles.includes(role)) {
      return jsonResponse({ error: `Invalid role: ${role}` }, 400);
    }
    const targetRole = role as (typeof allowedTargetRoles)[number];
    const brandRole = targetRole === 'assistant' ? 'operator' : targetRole;

    const { error: updateProfileError } = await adminClient
      .from('profiles')
      .update({
        name,
        email,
        role: targetRole,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
    if (updateProfileError) {
      return jsonResponse({ error: updateProfileError.message }, 400);
    }

    if (brandId) {
      const { error: deleteError } = await adminClient
        .from('user_brands')
        .delete()
        .eq('user_id', userId);
      if (deleteError) {
        return jsonResponse({ error: deleteError.message }, 400);
      }

      const insertPayload: Record<string, unknown> = {
        user_id: userId,
        brand_id: brandId,
        role: brandRole,
      };
      if (storeId) insertPayload.store_id = storeId;

      const { error: insertError } = await adminClient
        .from('user_brands')
        .insert(insertPayload);
      if (insertError) {
        return jsonResponse({ error: insertError.message }, 400);
      }
    }

    return jsonResponse({ ok: true }, 200);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return jsonResponse({ error: message }, 500);
  }
});

