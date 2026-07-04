// netlify/functions/create-order.js
const { getStore } = require('@netlify/blobs');
const { db } = require('./_firebaseAdmin');

// ============================================
// ALTERE AQUI — variáveis de ambiente necessárias no Netlify:
// (Site settings → Environment variables)
//
// SITE_URL       = https://storemakeup.netlify.app
// INFINITE_TAG   = sua Infinite Tag, SEM o símbolo $
// WEBHOOK_SECRET = uma senha longa e aleatória, inventada por você
// FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY = da chave de serviço do Firebase
// ============================================
const SITE_URL = process.env.SITE_URL;
const INFINITE_TAG = process.env.INFINITE_TAG;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

const PRODUCT_PRICE_CENTS = 1000; // R$10,00 — travado no servidor
const MOTOBOY_FEE_CENTS = 500; // R$5,00 — travado no servidor
const FRETE_MIN_CENTS = 500; // R$5,00
const FRETE_MAX_CENTS = 30000; // R$300,00

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': SITE_URL || '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método não permitido' }) };
  }

  // ---- Rate limiting básico por IP ----
  const clientIp =
    event.headers['x-nf-client-connection-ip'] || event.headers['x-forwarded-for'] || 'unknown-ip';

  try {
    const rateLimitStore = getStore('rate-limits');
    const limitKey = `ratelimit:${clientIp}`;
    const now = Date.now();
    const windowMs = 10 * 60 * 1000; // 10 minutos
    const maxRequests = 5;

    let rateData = await rateLimitStore.get(limitKey, { type: 'json' });
    if (!rateData || now - rateData.startTime > windowMs) {
      rateData = { count: 1, startTime: now };
    } else {
      rateData.count += 1;
    }
    await rateLimitStore.setJSON(limitKey, rateData);

    if (rateData.count > maxRequests) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({ error: 'Muitas tentativas. Aguarde 10 minutos e tente novamente.' }),
      };
    }
  } catch (err) {
    // se o rate limit falhar por algum motivo, não travamos a compra por causa disso
    console.error('Rate limit error:', err);
  }

  // ---- Validação e criação do pedido ----
  try {
    const body = JSON.parse(event.body || '{}');
    const { customer, delivery, items } = body;

    if (!customer?.name || !customer?.phone || !items?.length) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Dados do cliente ou itens ausentes' }),
      };
    }

    const order_nsu = require('crypto').randomUUID();

    // preço travado no servidor — ignora qualquer valor vindo do front
    const infinitePayItems = items.map((item) => ({
      quantity: item.quantity || 1,
      price: PRODUCT_PRICE_CENTS,
      description: item.name,
    }));

    let deliveryFeeCents = 0;
    let deliveryMethod = 'retirada';

    if (delivery?.type === 'motoboy') {
      deliveryMethod = 'motoboy';
      deliveryFeeCents = MOTOBOY_FEE_CENTS;
      infinitePayItems.push({ quantity: 1, price: deliveryFeeCents, description: 'Entrega (motoboy)' });
    } else if (delivery?.type === 'correios') {
      deliveryMethod = 'correios';
      const valorEnviado = Math.round((delivery.shippingValue || 0) * 100);

      if (valorEnviado < FRETE_MIN_CENTS || valorEnviado > FRETE_MAX_CENTS) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Valor de frete fora da faixa permitida. Recalcule o frete.' }),
        };
      }

      deliveryFeeCents = valorEnviado;
      infinitePayItems.push({
        quantity: 1,
        price: deliveryFeeCents,
        description: 'Frete (Correios/transportadora)',
      });
    }

    const productTotalCents = infinitePayItems
      .filter((i) => i.description !== 'Entrega (motoboy)' && i.description !== 'Frete (Correios/transportadora)')
      .reduce((sum, i) => sum + i.price * i.quantity, 0);

    const totalCents = productTotalCents + deliveryFeeCents;

    // ---- Salva o pedido no Firestore (fonte única de dados, lida pelo painel admin) ----
    await db
      .collection('orders')
      .doc(order_nsu)
      .set({
        order_nsu,
        customer: {
          name: customer.name,
          phone: customer.phone,
          cpf: customer.cpf || null,
          email: customer.email || null,
        },
        date: new Date().toLocaleString('pt-BR'),
        deliveryMethod,
        deliveryAddress: delivery?.type ? delivery : null,
        items: items.map((i) => ({ name: i.name, quantity: i.quantity || 1 })),
        status: 'Aguardando Pagamento',
        total: totalCents / 100,
      });

    // ---- Chama a InfinitePay ----
    const webhookUrl = `${SITE_URL}/api/webhook?secret=${WEBHOOK_SECRET}`;

    const infinitePayResponse = await fetch('https://api.checkout.infinitepay.io/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        handle: INFINITE_TAG,
        redirect_url: `${SITE_URL}/obrigado?order_nsu=${order_nsu}`,
        webhook_url: webhookUrl,
        order_nsu,
        items: infinitePayItems,
      }),
    });

    if (!infinitePayResponse.ok) {
      const errText = await infinitePayResponse.text();
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ error: 'Falha ao criar link de pagamento', details: errText }),
      };
    }

    const data = await infinitePayResponse.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ order_nsu, checkout_url: data.url }),
    };
  } catch (err) {
    console.error('create-order error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Erro interno', details: String(err) }),
    };
  }
};
