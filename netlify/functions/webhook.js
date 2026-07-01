// netlify/functions/webhook.js
import { getStore } from "@netlify/blobs";

export default async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método não permitido" }), { status: 405 });
  }

  try {
    const payload = await req.json();
    const { order_nsu, transaction_nsu, paid_amount, receipt_url } = payload;

    if (!order_nsu) {
      return json({ error: "order_nsu ausente no webhook" }, 400);
    }

    const store = getStore("orders");
    const order = await store.get(order_nsu, { type: "json" });

    if (!order) {
      // responde 200 mesmo assim pra InfinitePay não ficar reenviando
      return json({ received: true, warning: "pedido não encontrado" }, 200);
    }

    order.status = "pago";
    order.transaction_nsu = transaction_nsu;
    order.paid_amount = paid_amount;
    order.receipt_url = receipt_url;
    order.paidAt = new Date().toISOString();

    await store.setJSON(order_nsu, order);

    return json({ received: true }, 200);
  } catch (err) {
    return json({ error: "Erro interno", details: String(err) }, 500);
  }
};

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const config = {
  path: "/api/webhook",
};
