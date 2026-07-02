// netlify/functions/webhook.js
const { db } = require('./_firebaseAdmin');

// ============================================
// ALTERE AQUI — use a MESMA senha configurada em WEBHOOK_SECRET (variável de ambiente no Netlify)
// ============================================
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Método não permitido' }) };
  }

  // ---- Valida se a chamada realmente veio autorizada ----
  const params = event.queryStringParameters || {};
  if (!WEBHOOK_SECRET || params.secret !== WEBHOOK_SECRET) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Não autorizado' }) };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const { order_nsu, transaction_nsu, paid_amount, receipt_url } = payload;

    if (!order_nsu) {
      return { statusCode: 400, body: JSON.stringify({ error: 'order_nsu ausente no webhook' }) };
    }

    const orderRef = db.collection('orders').doc(order_nsu);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      // responde 200 mesmo assim pra InfinitePay não ficar reenviando
      return { statusCode: 200, body: JSON.stringify({ received: true, warning: 'pedido não encontrado' }) };
    }

    await orderRef.update({
      status: 'Pago',
      transaction_nsu: transaction_nsu || null,
      paid_amount: paid_amount || null,
      receipt_url: receipt_url || null,
      paidAt: new Date().toLocaleString('pt-BR'),
    });

    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  } catch (err) {
    console.error('webhook error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Erro interno', details: String(err) }) };
  }
};
