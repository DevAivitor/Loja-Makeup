// netlify/functions/webhook.js
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

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
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método não permitido" }), { status: 405 });
  }

  try {
    const payload = await req.json();
    const { order_nsu, transaction_nsu, paid_amount, receipt_url } = payload;

    if (!order_nsu) {
      return json({ error: "order_nsu ausente no webhook" }, 400);
    }

    const orderRef = db.collection("orders").doc(order_nsu);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return json({ received: true, warning: "pedido não encontrado" }, 200);
    }

    await orderRef.update({
      status: "Pago",
      transaction_nsu: transaction_nsu || null,
      paid_amount: paid_amount || null,
      receipt_url: receipt_url || null,
      paidAt: FieldValue.serverTimestamp(),
    });

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
