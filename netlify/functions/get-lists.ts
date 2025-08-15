import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

type ListaMeta = Record<string, any>;
type ItemRow   = Record<string, any>;

const H = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store, no-cache, must-revalidate, max-age=0',
  pragma: 'no-cache',
} as const;

const TABLE_LISTAS = process.env.SUPABASE_TABLE_LISTAS || 'listas';
const TABLE_ITEMS  = process.env.SUPABASE_TABLE_ITEMS  || 'items';
const FK_LISTA_ID  = process.env.SUPABASE_FK_LISTA_ID  || 'lista_id';

function fallback() {
  const latest = {
    id: 0,
    nombre: 'Migración inicial (fallback)',
    origen: 'fallback',
    vigenteDesde: new Date().toISOString().slice(0, 10),
    items: [
      { codigo: 'A001', descripcion: 'Remera deportiva', color: 'Azul',  alto: '0.75', unidad: 1, sugerido: 3500.5 },
      { codigo: 'A002', descripcion: 'Pantalón running', color: 'Negro', alto: '1.00', unidad: 1, sugerido: 7500 },
    ],
  };
  return { latest, anteriores: [] as any[] };
}

function pickFecha(m: ListaMeta): string | null {
  const cand = [
    m.vigenteDesde, m.vigente_desde, m.fecha_vigencia,
    m.fecha, m.created_at, m.updated_at,
  ].find(Boolean);
  if (!cand) return null;
  const d = new Date(String(cand));
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function normalizeItem(r: ItemRow) {
  // Mapear columnas típicas a las que espera el front
  const codigo = String(r.codigo ?? r.cod ?? r.code ?? r.id ?? '').trim();
  const descripcion = String(
    r.descripcion ?? r.description ?? r.detalle ?? r.nombre ?? ''
  ).trim();
  const color    = r.color ?? r.color_name ?? null;
  const alto     = (r.alto ?? r.alto_cm ?? r.height ?? null) && String(r.alto ?? r.alto_cm ?? r.height);
  const unidad   = Number(r.unidad ?? r.qty ?? 1) || 1;
  const sugerido = Number(r.sugerido ?? r.precio ?? r.price ?? r.punit ?? 0) || 0;
  return { codigo, descripcion, color, alto, unidad, sugerido };
}

export const handler: Handler = async () => {
  try {
    const url = process.env.SUPABASE_URL;
    const serviceRole =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE ||
      process.env.SUPABASE_SERVICE_ROLE_TOKEN;

    if (!url || !serviceRole) {
      console.error('Faltan SUPABASE_URL o SERVICE_ROLE en Netlify.');
      return { statusCode: 200, headers: H, body: JSON.stringify(fallback()) };
    }

    const supabase = createClient(url, serviceRole, { auth: { persistSession: false } });

    // 1) última lista por id desc (no dependemos de nombres de columnas)
    const { data: listas, error: errL } = await supabase
      .from(TABLE_LISTAS)
      .select('*')
      .order('id', { ascending: false })
      .limit(1);

    if (errL) throw errL;

    const meta: ListaMeta | undefined = listas?.[0];
    if (!meta) return { statusCode: 200, headers: H, body: JSON.stringify(fallback()) };

    // 2) items de esa lista: seleccionamos '*' y normalizamos en JS
    const { data: itemsRows, error: errI } = await supabase
      .from(TABLE_ITEMS)
      .select('*')
      .eq(FK_LISTA_ID, meta.id);

    if (errI) throw errI;

    const items = (itemsRows ?? []).map(normalizeItem)
      .sort((a, b) => String(a.codigo).localeCompare(String(b.codigo)));

    const latest = { ...meta, items, fecha: pickFecha(meta) };

    // 3) anteriores (solo metadata) por id desc
    const { data: prev, error: errP } = await supabase
      .from(TABLE_LISTAS)
      .select('*')
      .lt('id', meta.id)
      .order('id', { ascending: false })
      .limit(10);

    if (errP) throw errP;

    return {
      statusCode: 200,
      headers: H,
      body: JSON.stringify({ latest, anteriores: prev ?? [] }),
    };
  } catch (e) {
    console.error('get-lists error:', e);
    // Nunca devolvemos 500 para que el front no se caiga
    return { statusCode: 200, headers: H, body: JSON.stringify(fallback()) };
  }
};