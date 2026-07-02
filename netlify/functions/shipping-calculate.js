// netlify/functions/shipping-calculate.js

// ============================================
// ALTERE AQUI — preencha com seus dados reais
// ============================================
const MELHOR_ENVIO_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiMTExMGZkZmY1Mjg1YmU2ZWQ1YzNmYjUxMjkxOGIxODhmZDE5MmM4YzgzMDNhMDJiMTRlNDk5MzRmYTMyMTNhMTk1MTQ4YmYyMTNiYTI3NmYiLCJpYXQiOjE3ODI5NTMzNDQuMjMxMDY5LCJuYmYiOjE3ODI5NTMzNDQuMjMxMDcxLCJleHAiOjE4MTQ0ODkzNDQuMjE4OTk1LCJzdWIiOiJhMjFjODY3OC05ZWFmLTQ5ZDQtYjQ0Ni1kOGQwZGUxODVjNzIiLCJzY29wZXMiOlsiY2FydC1yZWFkIiwiY2FydC13cml0ZSIsImNvbXBhbmllcy1yZWFkIiwiY29tcGFuaWVzLXdyaXRlIiwiY291cG9ucy1yZWFkIiwiY291cG9ucy13cml0ZSIsIm5vdGlmaWNhdGlvbnMtcmVhZCIsIm9yZGVycy1yZWFkIiwicHJvZHVjdHMtcmVhZCIsInByb2R1Y3RzLWRlc3Ryb3kiLCJwcm9kdWN0cy13cml0ZSIsInB1cmNoYXNlcy1yZWFkIiwic2hpcHBpbmctY2FsY3VsYXRlIiwic2hpcHBpbmctY2FuY2VsIiwic2hpcHBpbmctY2hlY2tvdXQiLCJzaGlwcGluZy1jb21wYW5pZXMiLCJzaGlwcGluZy1nZW5lcmF0ZSIsInNoaXBwaW5nLXByZXZpZXciLCJzaGlwcGluZy1wcmludCIsInNoaXBwaW5nLXNoYXJlIiwic2hpcHBpbmctdHJhY2tpbmciLCJlY29tbWVyY2Utc2hpcHBpbmciLCJ0cmFuc2FjdGlvbnMtcmVhZCIsInVzZXJzLXJlYWQiLCJ1c2Vycy13cml0ZSIsIndlYmhvb2tzLXJlYWQiLCJ3ZWJob29rcy13cml0ZSIsIndlYmhvb2tzLWRlbGV0ZSIsInRkZWFsZXItd2ViaG9vayJdfQ.WPGVPp5AI6ZCkmy71Vkf9vUqdlgAfPMA7q0BTX7njCb3y1Z-Q7F8LDwsdvwX4Zk5VuRI17QqmWLfTIx4D-cn0vLZzMUPRGi1ZSxqVFEslaP_XI25RpYMpUIXq4pSCDgrNLcNdT9aA6m0-Jt6CqP4DWSvdMfb9tTGL0hh49x5oTL-UGxaB--8xXw2gpAlMgc5AK9vZ6NWS6MMlKG46iItc2zBruGe2jR98BHwU4UNbR6Lqazq5f3QsLO-Dl8-mDWfcr-0SiGSVog7cLXIrSuPGcc-dpXB6gCNdztn7gy5kjybutLMXWDOBOZBt0CmlDFvBYXNdG5gWiwTmJwQxNXvw03U34U-TDoIDZBeIKUUypgD9dbkeJmOI45vaPKyF44YBm_HNBjPhWJTmCHlyE5wu_bK-p3t7ncOVwy5wZRwePV72EjnnOAxFEHkI4rU1Vm7V-bRdVg71kje6LoSSxhqztg0D5US4bxrDpHr4_xts9bide9W0XQYwGZfqn640lgZHJ2gBr95e8cUhoJORlMz7aLy5v1IN4LtuBiRcsX8mOa7NVXP0KMSGSRq3bscXwWgatxcxVA1vGcRjZXUnMwSOdJ4o6nDuNmUCeyujiHGKf57KFy9hl_Ht3PfVwEUHbQl2483WhdRjUQIOHq6hVjKwLzrf4EkkbrLVzaWmohK6eY"; // Token de produção do Melhor Envio
const CEP_ORIGEM = "78785000"; // CEP de onde a loja despacha os produtos
// ============================================

export default async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método não permitido" }), { status: 405 });
  }

  try {
    const body = await req.json();
    const { toPostalCode, products } = body;

    if (!toPostalCode || !products?.length) {
      return json({ error: "CEP de destino ou produtos ausentes" }, 400);
    }

    const payload = {
      from: { postal_code: CEP_ORIGEM },
      to: { postal_code: toPostalCode },
      products: products.map((p) => ({
        id: String(p.id),
        width: p.width || 10,
        height: p.height || 10,
        length: p.length || 10,
        weight: p.weight || 0.5,
        insurance_value: p.price,
        quantity: p.qty,
      })),
    };

    // ATENÇÃO: esta é a URL de PRODUÇÃO (sem "sandbox."), já que você está usando o token real.
    // Se algum dia quiser testar com token de sandbox, troque para:
    // https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate
    const response = await fetch(
      "https://www.melhorenvio.com.br/api/v2/me/shipment/calculate",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${MELHOR_ENVIO_TOKEN}`,
          Accept: "application/json",
          "Content-Type": "application/json",
          "User-Agent": "Loja Makeup (contato@lojamakeup.com.br)", // troque pelo seu contato real, o Melhor Envio exige isso
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return json({ error: "Erro ao calcular frete", details: data }, 502);
    }

    return json(data, 200);
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
  path: "/api/shipping/calculate",
};
