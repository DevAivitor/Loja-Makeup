// netlify/functions/order-status.js
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// ID do banco de dados Firestore (não é o "(default)" — este projeto usa um banco nomeado)
const FIRESTORE_DATABASE_ID = "ai-studio-8a527d65-fcd2-4834-8f27-aba88318ffb8";

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    }),
  });
}

const db = getFirestore(FIRESTORE_DATABASE_ID);

export default async (req) => {
  const url = new URL(req.url);
  const order_nsu = url.searchParams.get("order_nsu");

  if (!order_nsu) {
    return json({ error: "order_nsu é obrigatório" }, 400);
  }

  try {
    const orderSnap = await db.collection("orders").doc(order_nsu).get();

    if (!orderSnap.exists) {
      return json({ error: "Pedido não encontrado" }, 404);
    }

    const order = orderSnap.data();

    return json(
      {
        order_nsu: order.order_nsu,
        status: order.status,
        total: order.total,
        paid_amount: order.paid_amount || null,
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
