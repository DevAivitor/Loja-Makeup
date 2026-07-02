// netlify/functions/create-order.js
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// ============================================
// ALTERE AQUI — preencha com seus dados reais
// ============================================
const INFINITE_TAG = "carolarisio"; // Sua Infinite Tag da InfinitePay, SEM o símbolo $
const SITE_URL = "https://illustrious-nougat-721b23.netlify.app"; // URL do seu site
// ============================================

// ID do banco de dados Firestore (não é o "(default)" — este projeto usa um banco nomeado)
const FIRESTORE_DATABASE_ID = "ai-studio-8a527d65-fcd2-4834-8f27-aba88318ffb8";

const PRODUCT_PRICE_CENTS = 1000; // R$10,00 — travado no servidor
const MOTOBOY_FEE_CENTS = 500; // R$5,00 — travado no servidor
const FRETE_MIN_CENTS = 500;
const FRETE_MAX_CENTS = 30000;

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
    let deliveryMethod = "retirada";

    if (delivery?.type === "motoboy") {
      deliveryMethod = "motoboy";
      deliveryFeeCents = MOTOBOY_FEE_CENTS;
      infinitePayItems.push({ quantity: 1, price: deliveryFeeCents, description: "Entrega (motoboy)" });
    } else if (delivery?.type === "correios") {
      deliveryMethod = "correios";
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

    const totalCents = productTotalCents + deliveryFeeCents;

    const itemsDisplay = items.map((i) => `${i.name} (x${i.quantity || 1})`);

    const orderRef = db.collection("orders").doc(order_nsu);
    await orderRef.set({
      order_nsu,
      customer: {
        name: customer.name,
        phone: customer.phone,
        email: customer.email || null,
        cpf: customer.cpf || null,
      },
      date: new Date().toLocaleString("pt-BR"),
      deliveryMethod,
      delivery: delivery?.type ? delivery : null,
      items: itemsDisplay,
      status: "Aguardando Pagamento",
      total: totalCents / 100,
      createdAt: FieldValue.serverTimestamp(),
    });

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
      await orderRef.update({ status: "Erro ao gerar pagamento" });
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
