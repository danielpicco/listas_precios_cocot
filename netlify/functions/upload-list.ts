import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function chunk<T>(arr: T[], size = 1000): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    // Espera: { nombre, origen, vigenteDesde, items:[{codigo, descripcion, color, alto, unidad, sugerido}, ...] }
    const body = JSON.parse(event.body || '{}');

    const nombre: string = body?.nombre || body?.lista?.nombre || 'lista';
    const origen: string = body?.origen || body?.lista?.origen || null;
    const vigenteDesde: string =
      body?.vigenteDesde || body?.lista?.vigenteDesde || new Date().toISOString().slice(0,10);
    const items: any[] = body?.items || body?.lista?.items || [];

    if (!Array.isArray(items) || items.length === 0) {
      return { statusCode: 400, body: 'Faltan items para la lista' };
    }

    const { data: listaIns, error: errLista } = await supabase
      .from('listas')
      .insert({ nombre, origen, vigente_desde: vigenteDesde })
      .select('id, nombre, vigente_desde')
      .single();

    if (errLista || !listaIns) {
      return { statusCode: 500, body: 'Error creando cabecera: ' + (errLista?.message || 'desconocido') };
    }

    const lista_id = listaIns.id as number;

    const rows = items.map(it => ({
      lista_id,
      codigo: String(it.codigo ?? ''),
      descripcion: String(it.descripcion ?? ''),
      color: it.color ?? null,
      alto: it.alto ?? null,
      unidad: it.unidad != null ? Number(it.unidad) : null,
      sugerido: it.sugerido != null ? Number(it.sugerido) : null,
    }));

    for (const part of chunk(rows, 1000)) {
      const { error } = await supabase.from('precios').insert(part);
      if (error) {
        await supabase.from('listas').delete().eq('id', lista_id); // rollback simple
        return { statusCode: 500, body: 'Error insertando precios: ' + error.message };
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, lista_id, nombre, vigente_desde: listaIns.vigente_desde })
    };
  } catch (e:any) {
    return { statusCode: 500, body: 'Error upload-list: ' + (e?.message || String(e)) };
  }
};