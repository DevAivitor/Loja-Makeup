// netlify/functions/order-status.js
import { getStore } from "@netlify/blobs";

export default async (req) => {
  const url = new URL(req.url);
  const order_nsu = url.searchParams.get("order_nsu");

  if (!order_nsu) {
    return json({ error: "order_nsu é obrigatório" }, 400);
  }

  try {
    const store = getStore("orders");
    const order = await store.get(order_nsu, { type: "json" });

    if (!order) {
      return json({ error: "Pedido não encontrado" }, 404);
    }

    return json(
      {
        order_nsu: order.order_nsu,
        status: order.status,
        total: order.total,
        paid_amount: order.paid_amount,
        receipt_url: order.receipt_url || null,
      },
      200
    );
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
  path: "/api/order-status",
};
