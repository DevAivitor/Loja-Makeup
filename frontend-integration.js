// Integração Front-end <-> Netlify Functions (InfinitePay)
// Como as functions ficam no mesmo domínio do site, não precisa configurar URL externa.

const API_BASE = "/api"; // resolve pra /api/create-order, /api/order-status etc (ver netlify.toml)


/**
 * Chame essa função no botão "Finalizar Compra"
 * cart: array do carrinho [{ name, quantity }]  (preço não vai daqui — é travado no servidor)
 * customerData: { name, phone, email }
 * deliveryInfo: null (retirada/local)
 *   | { type: "motoboy", address, number, neighborhood, city, state, zip }
 *   | { type: "correios", address, number, neighborhood, city, state, zip, shippingValue }
 *     // shippingValue = valor em REAIS retornado pela sua API de frete (Correios/transportadora)
 */
async function finalizarCompra(cart, customerData, deliveryInfo) {
  const botao = document.getElementById("btn-finalizar"); // ajuste o id conforme seu site
  if (botao) {
    botao.disabled = true;
    botao.textContent = "Gerando pagamento...";
  }

  try {
    const response = await fetch(`${API_BASE}/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer: customerData,
        delivery: deliveryInfo,
        items: cart,
      }),
    });

    if (!response.ok) {
      throw new Error("Falha ao criar pedido");
    }

    const data = await response.json();

    // guarda o order_nsu localmente, caso queira consultar o status depois
    localStorage.setItem("ultimo_order_nsu", data.order_nsu);

    // redireciona o cliente pro checkout da InfinitePay
    window.location.href = data.checkout_url;
  } catch (err) {
    alert("Não foi possível iniciar o pagamento. Tente novamente.");
    console.error(err);
    if (botao) {
      botao.disabled = false;
      botao.textContent = "Finalizar Compra";
    }
  }
}

/**
 * Chame essa função na página de "obrigado" (redirect_url)
 * pra confirmar visualmente o status do pagamento pro cliente.
 */
async function verificarStatusPedido() {
  const params = new URLSearchParams(window.location.search);
  const order_nsu = params.get("order_nsu") || localStorage.getItem("ultimo_order_nsu");

  if (!order_nsu) return;

  try {
    const response = await fetch(`${API_BASE}/order-status?order_nsu=${order_nsu}`);
    const data = await response.json();

    if (data.status === "pago") {
      // exiba sua tela de sucesso aqui
      document.getElementById("status-pagamento").textContent =
        "Pagamento confirmado! Obrigado pela compra.";
    } else {
      // o webhook pode demorar alguns segundos — vale tentar de novo
      document.getElementById("status-pagamento").textContent =
        "Confirmando seu pagamento...";
      setTimeout(verificarStatusPedido, 3000); // tenta de novo em 3s
    }
  } catch (err) {
    console.error(err);
  }
}
