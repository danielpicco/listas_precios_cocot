/ src/api/lists.js
// API para listas de precios - compatible con tus Netlify Functions:
//   - /.netlify/functions/get-lists
//   - /.netlify/functions/save-list
//   - /.netlify/functions/delete-list

/**
 * @typedef {Object} Item
 * @property {string} codigo
 * @property {string=} descripcion
 * @property {string=} color
 * @property {string=} talle
 * @property {number=} unidad
 * @property {number=} sugerido
 * @property {string=} origen
 */

/**
 * @typedef {Object} Lista
 * @property {string} id
 * @property {string} nombre
 * @property {string} vigente_desde  // YYYY-MM-DD
 * @property {string=} origen
 * @property {string} creado_en      // ISO
 * @property {Item[]} items
 */

const BASE = "/.netlify/functions";

// --- util fetch con timeout y mensaje de error claro ---
async function fetchJSON(url, options = {}, { timeoutMs = 15000 } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal });
    const text = await res.text(); // leemos texto para incluir en error si falla
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}: ${text || "(sin cuerpo)"}`);
    }
    return text ? JSON.parse(text) : null;
  } finally {
    clearTimeout(t);
  }
}

/**
 * Lee todas las listas persistidas (ordenadas: más recientes primero).
 * Evita caché del navegador para que siempre traiga lo último.
 * @returns {Promise<Lista[]>}
 */
export async function getLists() {
  const url = `${BASE}/get-lists?ts=${Date.now()}`; // cache-buster
  const data = await fetchJSON(url, { cache: "no-store" });
  const listas = Array.isArray(data?.listas) ? data.listas : [];
  listas.sort((a, b) => new Date(b.creado_en) - new Date(a.creado_en));
  return listas;
}

/**
 * Guarda una lista. Devuelve { ok: true, saved: Lista, total: number }
 * @param {{ nombre:string, vigente_desde:string, origen?:string, items: Item[] }} payload
 * @returns {Promise<{ ok:boolean, saved?: Lista, total?: number }>}
 */
export async function saveList(payload) {
  if (!payload?.nombre) throw new Error('Falta "nombre" en payload');
  if (!payload?.vigente_desde) throw new Error('Falta "vigente_desde" (YYYY-MM-DD)');

  return await fetchJSON(`${BASE}/save-list`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/**
 * Elimina una lista por id. Devuelve { ok:true, deletedId, total }
 * @param {string} id
 * @returns {Promise<{ ok:boolean, deletedId:string, total:number }>}
 */
export async function deleteList(id) {
  if (!id) throw new Error('Falta "id"');
  return await fetchJSON(`${BASE}/delete-list`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
}