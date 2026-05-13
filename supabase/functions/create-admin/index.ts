import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Check Auth (Must be called by an existing admin)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify the caller's JWT
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: callerUser }, error: verifyError } = await supabaseAdmin.auth.getUser(token)
    
    if (verifyError || !callerUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Verify caller is actually an admin
    const { data: callerProfile } = await supabaseAdmin
      .from('users')
      .select('admin_role, role')
      .eq('id', callerUser.id)
      .single()

    if (!callerProfile || (callerProfile.role !== 'admin' && !['super', 'manager'].includes(callerProfile.admin_role))) {
      return new Response(JSON.stringify({ error: 'Forbidden: Caller is not an admin' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 2. Read Request Data
    const { email, password, name, role, permissions } = await req.json()

    if (!email || !password || !name || !role) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 3. Create User in Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: { name: name, login_id: email.split('@')[0] }
    })

    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 4. Insert into public.users
    const userId = authData.user.id
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        email: email,
        login_id: email.split('@')[0],
        name: name,
        role: 'admin', // Basic Supabase role
        admin_role: role,
        permissions: role === 'super' ? ['all'] : (permissions || []),
        hospital_name: '본사',
        business_number: '000-00-00000', // Dummy value for required fields if any
        phone: '000-0000-0000'
      })

    if (dbError) {
      // Rollback Auth user if DB insert fails
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return new Response(JSON.stringify({ error: dbError.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ user: authData.user }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
