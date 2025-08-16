// src/api/lists.ts
export type Item = {
  codigo: string;
  descripcion?: string;
  color?: string;
  unidad?: number | null;
  sugerido?: number | null;
};

export type ListaPayload = {
  nombre: string;             // ej: "Lista Agosto"
  vigente_desde: string;      // "YYYY-MM-DD"
  origen?: string | null;     // nombre del archivo subido (opcional)
  items: Item[];              // [{ codigo: "...", ... }]
};

export type Lista = ListaPayload & {
  id: string;
  creado_en: string;
};

const BASE = "/.netlify/functions";

export async function saveList(payload: ListaPayload): Promise<{ ok: boolean; id?: string; error?: string }> {
  const res = await fetch(`${BASE}/save-list`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return { ok: false, error: await res.text() };
  return await res.json();
}

export async function getLists(): Promise<Lista[]> {
  const res = await fetch(`${BASE}/get-lists`);
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.listas ?? [];
}

export async function deleteList(id: string): Promise<boolean> {
  const res = await fetch(`${BASE}/delete-list`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  return res.ok;
}