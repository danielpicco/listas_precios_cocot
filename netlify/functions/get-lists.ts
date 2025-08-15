// netlify/functions/get-lists.ts
import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

type Item = {
  codigo: string;
  descripcion: string;
  color?: string;
  alto?: string;
  unidad?: number;
  sugerido: number;
};

type ListaMeta = {
  id: number;
  nombre: string;
  origen?: string;
  vigenteDesde?: string; // tu backend venía usando este nombre
};

const JSON_NO_CACHE_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store, no-cache, must-revalidate, max-age=0',
  pragma: 'no-cache',
} as const;

export const handler: Handler = async () => {
  try {
    const url = process.env.SUPABASE_URL;
    const serviceRole =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE ||
      process.env.SUPABASE_SERVICE_ROLE_TOKEN;

    if (!url || !serviceRole) {
      throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_* en el entorno.');
    }

    // Cliente admin (no persiste sesión en serverless)
    const supabase = createClient(url, serviceRole, {
      auth: { persistSession: false },
    });

    // 1) Última lista (orden por fecha descendente, luego id por si empata)
    const { data: listas, error: errListas } = await supabase
      .from('listas') // <-- CAMBIÁ este nombre si tu tabla difiere (p.ej. 'listas_precios')
      .select('id,nombre,origen,vigenteDesde')
      .order('vigenteDesde', { ascending: false })
      .order('id', { ascending: false })
      .limit(1);

    if (errListas) throw errListas;

    const latestMeta: ListaMeta | undefined = listas?.[0];

    // Si no hay listas, respondemos vacío
    if (!latestMeta) {
      return {
        statusCode: 200,
        headers: JSON_NO_CACHE_HEADERS,
        body: JSON.stringify({ latest: null, anteriores: [] }),
      };
    }

    // 2) Ítems de la última lista
    const { data: items, error: errItems } = await supabase
      .from('items') // <-- CAMBIÁ este nombre si tu tabla difiere (p.ej. 'items_lista' o 'articulos')
      .select('codigo,descripcion,color,alto,unidad,sugerido')
      .eq('lista_id', latestMeta.id)
      .order('codigo', { ascending: true });

    if (errItems) throw errItems;

    const latest = {
      ...latestMeta,
      items: (items ?? []) as Item[],
    };

    // 3) Listas anteriores (solo metadata, sin items)
    const { data: prevRows, error: errPrev } = await supabase
      .from('listas') // <-- mismo comentario que arriba
      .select('id,nombre,origen,vigenteDesde')
      .lt('id', latestMeta.id)
      .order('vigenteDesde', { ascending: false })
      .limit(10);

    if (errPrev) throw errPrev;

    const anteriores = prevRows ?? [];

    // ✅ ÉXITO: JSON + headers NO-CACHE (evita respuestas viejas, sobre todo en móvil)
    return {
      statusCode: 200,
      headers: JSON_NO_CACHE_HEADERS,
      body: JSON.stringify({ latest, anteriores }),
    };
  } catch (e: any) {
    // ❌ ERROR: log y respuesta JSON útil para depurar
    console.error('get-lists error:', e);
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        error: 'Error get-lists',
        message: e?.message ?? String(e),
      }),
    };
  }
};