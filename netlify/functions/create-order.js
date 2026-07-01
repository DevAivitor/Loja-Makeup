// netlify/functions/create-order.js
import { getStore } from "@netlify/blobs";

// ============================================
// ALTERE AQUI — preencha com seus dados reais
// ============================================
const INFINITE_TAG = "SUA_INFINITE_TAG_AQUI"; // Sua Infinite Tag da InfinitePay, SEM o símbolo $
const SITE_URL = "https://storemakeup.netlify.app"; // URL do seu site (troque se o domínio mudar)
// ============================================

const PRODUCT_PRICE_CENTS = 1000; // R$10,00 — preço único da loja, travado no servidor
const MOTOBOY_FEE_CENTS = 500; // R$5,00 — taxa de motoboy, travada no servidor

const FRETE_MIN_CENTS = 500; // R$5,00 — valor mínimo aceito de frete Correios
const FRETE_MAX_CENTS = 30000; // R$300,00 — valor máximo aceito de frete Correios

export default async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método não permitido" }), { status: 405 });
  }

  try {
    const body = await req.json();
    const { customer, delivery, items } = body;

    if (!customer?.name || !customer?.phone || !items?.length) {
      return json({ error: "Dados do cliente ou itens ausentes" }, 400);
    }

    const order_nsu = crypto.randomUUID();

    const infinitePayItems = items.map((item) => ({
      quantity: item.quantity || 1,
      price: PRODUCT_PRICE_CENTS,
      description: item.name,
    }));

    let deliveryFeeCents = 0;

    if (delivery?.type === "motoboy") {
      deliveryFeeCents = MOTOBOY_FEE_CENTS;
      infinitePayItems.push({ quantity: 1, price: deliveryFeeCents, description: "Entrega (motoboy)" });
    } else if (delivery?.type === "correios") {
      const valorEnviado = Math.round((delivery.shippingValue || 0) * 100);

      if (valorEnviado < FRETE_MIN_CENTS || valorEnviado > FRETE_MAX_CENTS) {
        return json({ error: "Valor de frete fora da faixa permitida. Recalcule o frete." }, 400);
      }

      deliveryFeeCents = valorEnviado;
      infinitePayItems.push({ quantity: 1, price: deliveryFeeCents, description: "Frete (Correios/transportadora)" });
    }

    const productTotalCents = infinitePayItems
      .filter((i) => i.description !== "Entrega (motoboy)" && i.description !== "Frete (Correios/transportadora)")
      .reduce((sum, i) => sum + i.price * i.quantity, 0);

    const order = {
      order_nsu,
      customer,
      delivery: delivery?.type ? delivery : null,
      items,
      total: productTotalCents + deliveryFeeCents,
      status: "pendente",
      createdAt: new Date().toISOString(),
    };

    const store = getStore("orders");
    await store.setJSON(order_nsu, order);

    const webhookUrl = `${SITE_URL}/api/webhook`;

    const infinitePayResponse = await fetch("https://api.checkout.infinitepay.io/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      return json({ error: "Falha ao criar link de pagamento", details: errText }, 502);
    }

    const data = await infinitePayResponse.json();

    return json({ order_nsu, checkout_url: data.url }, 200);
  } catch (err) {
    return json({ error: "Erro interno", details: String(err) }, 500);
  }
};

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export const config = {
  path: "/api/create-order",
};
