// netlify/functions/order-status.js
const { db } = require('./_firebaseAdmin');

const SITE_URL = process.env.SITE_URL;

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': SITE_URL || '*',
  };

  const order_nsu = event.queryStringParameters?.order_nsu;

  if (!order_nsu) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'order_nsu é obrigatório' }) };
  }

  try {
    const orderSnap = await db.collection('orders').doc(order_nsu).get();

    if (!orderSnap.exists) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Pedido não encontrado' }) };
    }

    const order = orderSnap.data();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        order_nsu: order.order_nsu,
        status: order.status,
        total: order.total,
        paid_amount: order.paid_amount || null,
        receipt_url: order.receipt_url || null,
      }),
    };
  } catch (err) {
    console.error('order-status error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Erro interno', details: String(err) }) };
  }
};
