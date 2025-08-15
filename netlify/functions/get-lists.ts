import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const handler: Handler = async () => {
  try {
    const { data: listas, error: errL } = await supabase
      .from('listas')
      .select('id, nombre, origen, vigente_desde, creado_en')
      .order('vigente_desde', { ascending: false })
      .order('id', { ascending: false })
      .limit(50);

    if (errL) return { statusCode: 500, body: 'Error leyendo listas: ' + errL.message };

    const latestHeader = listas?.[0] || null;

    let latestItems: any[] = [];
    if (latestHeader) {
      const { data: items, error: errI } = await supabase
        .from('precios')
        .select('codigo, descripcion, color, alto, unidad, sugerido')
        .eq('lista_id', latestHeader.id)
        .order('codigo', { ascending: true });

      if (errI) return { statusCode: 500, body: 'Error leyendo items: ' + errI.message };
      latestItems = items || [];
    }

    const latest = latestHeader
      ? { id: latestHeader.id, nombre: latestHeader.nombre, origen: latestHeader.origen, vigenteDesde: latestHeader.vigente_desde, items: latestItems }
      : null;

    const anteriores = (listas || []).slice(1).map(l => ({
      id: l.id, nombre: l.nombre, origen: l.origen, vigenteDesde: l.vigente_desde
    }));

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ latest, anteriores }) };
  } catch (e:any) {
    return { statusCode: 500, body: 'Error get-lists: ' + (e?.message || String(e)) };
  }
};