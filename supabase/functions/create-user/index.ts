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
      console.error('[create-user] Missing Authorization header');
      return jsonResponse({ error: 'Missing authorization header' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify the caller's JWT
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    const callerClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: { user: callerUser }, error: sessionError } = await callerClient.auth.getUser(token);
    if (sessionError || !callerUser) {
      console.error('[create-user] JWT verification failed:', sessionError?.message);
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    // Check caller role — admin or developer only
    const { data: callerProfile, error: profileError } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', callerUser.id)
      .single();

    if (profileError) {
      console.error('[create-user] Could not load caller profile:', profileError.message);
      return jsonResponse({ error: `Could not verify permissions: ${profileError.message}` }, 403);
    }

    if (!callerProfile || !['admin', 'developer'].includes(callerProfile.role)) {
      console.error('[create-user] Insufficient role:', callerProfile?.role);
      return jsonResponse({ error: `Forbidden: your role (${callerProfile?.role ?? 'unknown'}) cannot create users` }, 403);
    }

    const body = await req.json();
    const { email, password, name, role, brandId, storeIds } = body;

    if (!email || !password || !name || !role || !brandId) {
      const missing = ['email', 'password', 'name', 'role', 'brandId'].filter(f => !body[f]);
      console.error('[create-user] Missing fields:', missing);
      return jsonResponse({ error: `Missing required fields: ${missing.join(', ')}` }, 400);
    }

    // Create the auth user (email_confirm: true skips confirmation email)
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role },
    });

    if (createError) {
      console.error('[create-user] Auth user creation failed:', createError.message);
      return jsonResponse({ error: createError.message }, 400);
    }

    const userId = newUser.user.id;
    console.log('[create-user] Auth user created:', userId);

    // Upsert profile
    const { error: profileUpsertError } = await adminClient.from('profiles').upsert({
      id: userId,
      email,
      name,
      role,
      is_active: true,
      needs_password_change: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

    if (profileUpsertError) {
      console.error('[create-user] Profile upsert failed:', profileUpsertError.message);
      // Non-fatal: profile trigger may have created it; continue
    }

    // user_brands.role uses 'operator' instead of 'assistant'
    const brandRole = role === 'assistant' ? 'operator' : role;

    // Try inserting with store_ids (requires migration-add-store-ids-to-user-brands.sql)
    const insertPayload: Record<string, unknown> = {
      user_id: userId,
      brand_id: brandId,
      role: brandRole,
    };

    // Attempt with store_ids first; fall back without it if the column doesn't exist
    const { error: brandError } = await adminClient.from('user_brands').insert({
      ...insertPayload,
      store_ids: storeIds ?? [],
    });

    if (brandError) {
      const isColumnMissing = brandError.message.includes('store_ids') ||
        brandError.code === 'PGRST204';

      if (isColumnMissing) {
        console.warn('[create-user] store_ids column missing — retrying without it. Apply migration-add-store-ids-to-user-brands.sql in Supabase SQL editor.');
        const { error: retryError } = await adminClient.from('user_brands').insert(insertPayload);
        if (retryError) {
          console.error('[create-user] user_brands insert (retry) failed:', retryError.message);
          return jsonResponse({
            userId,
            warning: `User created but could not link to brand: ${retryError.message}`,
          }, 207);
        }
      } else {
        console.error('[create-user] user_brands insert failed:', brandError.message);
        return jsonResponse({
          userId,
          warning: `User created but could not link to brand: ${brandError.message}`,
        }, 207);
      }
    }

    console.log('[create-user] User fully created and linked to brand:', userId);
    return jsonResponse({ userId }, 200);

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    console.error('[create-user] Unhandled exception:', message);
    return jsonResponse({ error: message }, 500);
  }
});
