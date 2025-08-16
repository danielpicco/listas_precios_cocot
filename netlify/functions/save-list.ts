import { Handler } from '@netlify/functions';

const GH_TOKEN = process.env.GITHUB_TOKEN!;
const GH_REPO  = process.env.GITHUB_REPO!;   // ej: "danielpicco/listas_precios_cocot"
const GH_BRANCH= process.env.GITHUB_BRANCH || 'main';
const GH_PATH  = process.env.GITHUB_PATH || 'data/price_lists.json';

async function getFile() {
  const res = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/${GH_PATH}?ref=${GH_BRANCH}`, {
    headers: { Authorization: `Bearer ${GH_TOKEN}`, 'Accept': 'application/vnd.github+json' }
  });
  if (res.status === 404) return { sha: null, data: { listas: [] } };
  if (!res.ok) throw new Error(`GitHub GET failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  const content = Buffer.from(json.content, 'base64').toString('utf8');
  return { sha: json.sha, data: JSON.parse(content || '{"listas":[]}') };
}

async function putFile(data: any, sha: string | null) {
  const body = {
    message: 'chore: update price lists',
    content: Buffer.from(JSON.stringify(data, null, 2), 'utf8').toString('base64'),
    branch: GH_BRANCH,
    ...(sha ? { sha } : {})
  };
  const res = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/${GH_PATH}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${GH_TOKEN}`, 'Accept': 'application/vnd.github+json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`GitHub PUT failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
    if (!GH_TOKEN || !GH_REPO) return { statusCode: 500, body: 'Faltan variables GITHUB_*' };

    const payload = JSON.parse(event.body || '{}');
    if (!payload?.nombre || !payload?.vigente_desde || !Array.isArray(payload?.items)) {
      return { statusCode: 400, body: 'Faltan campos: nombre, vigente_desde, items[]' };
    }

    const { sha, data } = await getFile();
    const itemsLimpios = payload.items
      .filter((r: any) => r?.codigo && String(r.codigo).trim() !== '')
      .map((r: any) => ({ ...r, unidad: r.unidad ?? r.unitario ?? null, unitario: undefined }));

    const key = `${payload.nombre}__${payload.vigente_desde}`;
    const nueva = {
      id: key,
      nombre: String(payload.nombre).trim(),
      vigente_desde: payload.vigente_desde,
      origen: payload.origen ?? null,
      creado_en: new Date().toISOString(),
      items: itemsLimpios
    };

    const listas: any[] = data.listas || [];
    const idx = listas.findIndex(l => (l.nombre === nueva.nombre && l.vigente_desde === nueva.vigente_desde));
    if (idx >= 0) listas[idx] = nueva; else listas.unshift(nueva);

    await putFile({ listas }, sha);
    return { statusCode: 200, body: JSON.stringify({ ok: true, id: key }) };
  } catch (e: any) {
    return { statusCode: 500, body: `Error: ${e.message}` };
  }
};
export default {};