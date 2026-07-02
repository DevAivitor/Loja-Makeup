// netlify/functions/webhook.js
import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    }),
  });
}

const db = admin.firestore();

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
      paidAt: admin.firestore.FieldValue.serverTimestamp(),
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
