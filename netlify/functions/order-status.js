// Arquivo: netlify/functions/order-status.js

// [!] CONFIGURAÇÃO NECESSÁRIA NO NETLIFY:
// - SITE_URL (ex: https://minhaloja.com.br)
const SITE_URL = process.env.SITE_URL || '*';

exports.handler = async (event, context) => {
  // CORREÇÃO 3 - Restringir CORS
  const headers = {
    'Access-Control-Allow-Origin': SITE_URL,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  // ... lógica existente de verificação do status do pedido na InfinitePay ...

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ order_nsu: event.queryStringParameters.order_nsu, status: 'pending' })
  };
};
