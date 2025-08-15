import type { Handler } from '@netlify/functions';

export const handler: Handler = async () => {
  // Nunca expongas valores reales; sólo indiquemos si existen
  const hasSiteId = !!process.env.NETLIFY_SITE_ID;
  const hasToken  = !!process.env.NETLIFY_API_TOKEN;

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ok: true,
      NETLIFY_SITE_ID_present: hasSiteId,
      NETLIFY_API_TOKEN_present: hasToken
    })
  };
};