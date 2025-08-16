import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!; // server-side only

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return { statusCode: 500, body: 'Supabase env vars missing (URL or SERVICE_ROLE_KEY).' };
    }

    const contentType = event.headers['content-type'] || event.headers['Content-Type'] || '';
    if (!contentType.includes('application/json')) {
      return { statusCode: 400, body: 'Content-Type must be application/json' };
    }

    // Payload esperado:
    // {
    //   "nombre": "Migración inicial",
    //   "vigente_desde": "2025-08-14",
    //   "origen": "Resumen Listas 2025-08.xlsx",
    //   "items": [ { "codigo":"A001", "descripcion":"...", "color":"...", "talle":"...", "unidad":1, "sugerido":3500.5 } ],
    //   "usuario_id": "opcional"
    // }
    const payload = JSON.parse(event.body || '{}');

    if (!payload?.nombre || !payload?.vigente_desde || !Array.isArray(payload?.items)) {
      return { statusCode: 400, body: 'Faltan campos: nombre, vigente_desde, items[]' };
    }

    const itemsLimpios = (payload.items as any[])
      .filter(r => r?.codigo && String(r.codigo).trim() !== '')
      .map(r => {
        const unidad = r.unidad ?? r.unitario ?? null;
        const obj = { ...r, unidad };
        delete (obj as any).unitario;
        return obj;
      });

    const row = {
      nombre: String(payload.nombre).trim(),
      vigente_desde: payload.vigente_desde,
      origen: payload.origen ?? null,
      items: itemsLimpios,
      usuario_id: payload.usuario_id ?? null
    };

    const { data, error } = await sb
      .from('price_lists')
      .upsert(row, { onConflict: 'nombre,vigente_desde' })
      .select()
      .single();

    if (error) {
      console.error('Supabase upsert error:', error);
      return { statusCode: 500, body: `DB error: ${error.message}` };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, id: (data as any).id }),
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (err: any) {
    console.error('upload-list fatal:', err);
    return { statusCode: 500, body: `Fatal: ${err.message || String(err)}` };
  }
};
export default {}; // hace feliz a esbuild