import { Handler } from '@netlify/functions';

const GH_TOKEN = process.env.GITHUB_TOKEN!;
const GH_REPO  = process.env.GITHUB_REPO!;
const GH_BRANCH= process.env.GITHUB_BRANCH || 'main';
const GH_PATH  = process.env.GITHUB_PATH || 'data/price_lists.json';

export const handler: Handler = async () => {
  try {
    const res = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/${GH_PATH}?ref=${GH_BRANCH}`, {
      headers: { Authorization: `Bearer ${GH_TOKEN}`, 'Accept': 'application/vnd.github+json' }
    });
    if (res.status === 404) return { statusCode: 200, body: JSON.stringify({ listas: [] }) };
    if (!res.ok) throw new Error(`GitHub GET failed: ${res.status} ${await res.text()}`);
    const json = await res.json();
    const content = Buffer.from(json.content, 'base64').toString('utf8');
    const data = JSON.parse(content || '{"listas":[]}');
    return { statusCode: 200, body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } };
  } catch (e: any) {
    return { statusCode: 500, body: `Error: ${e.message}` };
  }
};
export default {};