// Arquivo: netlify/functions/webhook.js

// [!] CONFIGURAÇÃO NECESSÁRIA NO NETLIFY:
// Adicione a variável WEBHOOK_SECRET em: Site settings -> Environment variables.
// O mesmo valor deve ser configurado na InfinitePay como header ou query param (ex: ?secret=SEU_SEGREDO)
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

exports.handler = async (event, context) => {
  // CORREÇÃO 1 - Validar autenticidade do webhook
  const providedSecret = event.headers['x-webhook-secret'] || (event.queryStringParameters && event.queryStringParameters.secret);
  
  if (!WEBHOOK_SECRET || providedSecret !== WEBHOOK_SECRET) {
    console.error('Tentativa de webhook não autorizada ou WEBHOOK_SECRET não configurado.');
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized webhook call' })
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const payload = JSON.parse(event.body);
    // ... lógica existente para atualizar o status do pedido para "pago" ...
    
    return {
      statusCode: 200,
      body: JSON.stringify({ received: true })
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid payload' })
    };
  }
};
