import type { Handler } from '@netlify/functions';

export const handler: Handler = async () => {
  const url = process.env.SUPABASE_URL || '';
  const srv = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  const mask = (s: string, n = 22) => (s ? s.slice(0, n) + '...' : '');

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ok: Boolean(url && srv),
      SUPABASE_URL_present: !!url,
      SUPABASE_URL_preview: mask(url),
      SERVICE_ROLE_present: !!srv,
      SERVICE_ROLE_len: srv.length
    })
  };
};