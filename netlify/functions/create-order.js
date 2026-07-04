// Arquivo: netlify/functions/create-order.js
const { getStore } = require('@netlify/blobs');

// [!] CONFIGURAÇÃO NECESSÁRIA NO NETLIFY:
// - SITE_URL (ex: https://minhaloja.com.br)
const SITE_URL = process.env.SITE_URL || '*';

exports.handler = async (event, context) => {
  // CORREÇÃO 3 - Restringir CORS
  const headers = {
    'Access-Control-Allow-Origin': SITE_URL,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  // CORREÇÃO 4 - Rate limiting básico em create-order
  const clientIp = event.headers['x-nf-client-connection-ip'] || event.headers['x-forwarded-for'] || 'unknown-ip';
  
  try {
    const rateLimitStore = getStore('rate-limits');
    const limitKey = `ratelimit:${clientIp}`;
    const now = Date.now();
    const windowMs = 10 * 60 * 1000; // 10 minutos
    const maxRequests = 5;

    let rateData = await rateLimitStore.get(limitKey, { type: 'json' });
    
    if (!rateData || (now - rateData.startTime > windowMs)) {
      rateData = { count: 1, startTime: now };
    } else {
      rateData.count += 1;
    }

    await rateLimitStore.setJSON(limitKey, rateData);

    if (rateData.count > maxRequests) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({ error: 'Muitas tentativas. Por favor, aguarde 10 minutos antes de tentar novamente.' })
      };
    }

    // ... lógica existente de criação do pedido na InfinitePay ...

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ order_nsu: 'mock', checkout_url: 'https://pay.infinitepay.io/mock' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
};
