import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'GET') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return { statusCode: 500, body: 'Supabase env vars missing (URL or SERVICE_ROLE_KEY).' };
    }

    const params = event.queryStringParameters || {};
    const usuario_id = params.usuario_id || null;

    let query = sb
      .from('price_lists')
      .select('id,nombre,vigente_desde,creado_en,origen,items,usuario_id')
      .order('vigente_desde', { ascending: false })
      .order('creado_en', { ascending: false });

    if (usuario_id) {
      query = query.eq('usuario_id', usuario_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase select error:', error);
      return { statusCode: 500, body: `DB error: ${error.message}` };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ listas: data ?? [] }),
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (err: any) {
    console.error('get-lists fatal:', err);
    return { statusCode: 500, body: `Fatal: ${err.message || String(err)}` };
  }
};
export default {};