// netlify/functions/delete-list.ts
import type { Handler } from '@netlify/functions';

const GH_TOKEN  = process.env.GITHUB_TOKEN!;
const GH_REPO   = process.env.GITHUB_REPO!;            // ej: "usuario/mi-repo"
const GH_BRANCH = process.env.GITHUB_BRANCH || 'main';
const GH_PATH   = process.env.GITHUB_PATH || 'data/price_lists.json';

async function fetchFile() {
  const url = `https://api.github.com/repos/${GH_REPO}/contents/${GH_PATH}?ref=${GH_BRANCH}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${GH_TOKEN}`,
      Accept: 'application/vnd.github+json',
    },
  });

  if (res.status === 404) {
    // Si el archivo aún no existe, devolvemos estructura vacía
    return { sha: null as string | null, data: { listas: [] as any[] } };
  }
  if (!res.ok) {
    throw new Error(`GitHub GET failed: ${res.status} ${await res.text()}`);
  }

  const json = await res.json();
  const content = Buffer.from(json.content, 'base64').toString('utf8');
  const data = content ? JSON.parse(content) : { listas: [] };
  return { sha: json.sha as string, data };
}

async function saveFile(payload: any, prevSha: string | null) {
  const url = `https://api.github.com/repos/${GH_REPO}/contents/${GH_PATH}`;
  const body = {
    message: `chore: delete price list (${new Date().toISOString()})`,
    content: Buffer.from(JSON.stringify(payload, null, 2), 'utf8').toString('base64'),
    branch: GH_BRANCH,
    ...(prevSha ? { sha: prevSha } : {}),
  };

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${GH_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`GitHub PUT failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }
    if (!GH_TOKEN || !GH_REPO) {
      return { statusCode: 500, body: 'Faltan variables de entorno GITHUB_TOKEN o GITHUB_REPO' };
    }

    const body = event.body ? JSON.parse(event.body) : {};
    const id = String(body.id || '').trim();
    if (!id) {
      return { statusCode: 400, body: 'Falta "id"' };
    }

    // Leer archivo actual
    const { sha, data } = await fetchFile();
    const listas: any[] = Array.isArray(data.listas) ? data.listas : [];

    // Filtrar la lista a borrar
    const before = listas.length;
    const filtered = listas.filter((l) => l.id !== id);

    if (filtered.length === before) {
      return { statusCode: 404, body: `No existe lista con id: ${id}` };
    }

    // Guardar archivo actualizado
    const payload = { listas: filtered };
    await saveFile(payload, sha);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, deletedId: id, total: filtered.length }),
    };
  } catch (e: any) {
    return { statusCode: 500, body: `Error: ${e.message}` };
  }
};

export default {};