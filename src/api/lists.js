// src/api/lists.js
// API para listas de precios - compatible con tu backend Netlify (get-lists/save-list)

/**
 * @typedef {Object} Item
 * @property {string} codigo
 * @property {string=} descripcion
 * @property {string=} color
 * @property {number=} unidad
 * @property {number=} sugerido
 * @property {string=} origen
 */

/**
 * @typedef {Object} Lista
 * @property {string} id
 * @property {string} nombre
 * @property {string} vigente_desde   // YYYY-MM-DD
 * @property {string=} origen
 * @property {string} creado_en       // ISO
 * @property {Item[]} items
 */

const BASE = "/.netlify/functions";

// --- util fetch con timeout y mejor mensaje de error ---
async function fetchJSON(url, options = {}, { timeoutMs = 15000 } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal });
    const text = await res.text(); // primero texto para poder incluir en el error
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}: ${text || "(sin cuerpo)"}`);
    return text ? JSON.parse(text) : null;
  } finally {
    clearTimeout(t);
  }
}

/**
 * Lee todas las listas persistidas.
 * @returns {Promise<Lista[]>}
 */
export async function getLists() {
  const data = await fetchJSON(`${BASE}/get-lists`);
  const listas = Array.isArray(data?.listas) ? data.listas : [];
  // Orden más reciente primero (opcional, pero útil para UI/comparador)
  listas.sort((a, b) => new Date(b.creado_en) - new Date(a.creado_en));
  return listas;
}

/**
 * Guarda una lista. Respeta el contrato del backend:
 * devuelve { ok: true, saved: Lista, total: number }
 * @param {{ nombre:string, vigente_desde:string, origen?:string, items: Item[] }} payload
 * @returns {Promise<{ ok:boolean, saved?: Lista, total?: number }>}
 */
export async function saveList(payload) {
  // validación mínima para errores tempranos en front
  if (!payload?.nombre) throw new Error('Falta "nombre" en payload');
  if (!payload?.vigente_desde) throw new Error('Falta "vigente_desde" (YYYY-MM-DD)');

  return await fetchJSON(`${BASE}/save-list`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/**
 * Borrado (deshabilitado por ahora). El backend aún no tiene esta función.
 * Si querés activarlo, creamos /.netlify/functions/delete-list y acá habilitamos la llamada.
 * @param {string} id
 * @returns {Promise<false>} siempre false hasta implementar backend
 */
export async function deleteList(id) {
  console.warn("deleteList no disponible: falta implementar la función en el backend.");
  return false;
}