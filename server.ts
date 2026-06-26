import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import axios from 'axios';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// -- MP Configuration --
let mpClient: MercadoPagoConfig | null = null;
function getMPClient() {
  if (!mpClient) {
    const token = process.env.MP_ACCESS_TOKEN;
    if (!token) throw new Error('MP_ACCESS_TOKEN is missing');
    mpClient = new MercadoPagoConfig({ accessToken: token });
  }
  return mpClient;
}

// -- API Routes --

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Create Preference for Mercado Pago
app.post('/api/checkout/preference', async (req, res) => {
  try {
    const client = getMPClient();
    const preference = new Preference(client);
    const { items, customer, orderId } = req.body;

    const response = await preference.create({
      body: {
        items: items.map((item: any) => ({
          id: String(item.id),
          title: item.name,
          quantity: item.qty,
          unit_price: item.price,
          currency_id: 'BRL',
        })),
        payer: {
          email: customer.email,
        },
        external_reference: orderId,
        back_urls: {
          success: `${process.env.APP_URL}/success`,
          failure: `${process.env.APP_URL}/failure`,
          pending: `${process.env.APP_URL}/pending`
        },
        auto_return: 'approved',
        notification_url: `${process.env.APP_URL}/api/checkout/webhook`,
      }
    });

    res.json({ id: response.id, init_point: response.init_point });
  } catch (error: any) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mercado Pago Webhook for order updates
app.post('/api/checkout/webhook', async (req, res) => {
  try {
    const { type, data } = req.body;
    
    // Process payment updates (in production we would update Firestore directly here
    // or trigger an event if we had Firebase Admin SDK initialized)
    // For now we just acknowledge the webhook.
    console.log('Webhook received:', type, data);

    res.status(200).send('OK');
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Melhor Envio Shipping Calculation
app.post('/api/shipping/calculate', async (req, res) => {
  try {
    const token = process.env.MELHOR_ENVIO_TOKEN;
    if (!token) throw new Error('MELHOR_ENVIO_TOKEN is missing');

    const { fromPostalCode, toPostalCode, products } = req.body;

    // Standard format for Melhor Envio calculate payload
    const payload = {
      from: { postal_code: fromPostalCode },
      to: { postal_code: toPostalCode },
      products: products.map((p: any) => ({
        id: String(p.id),
        width: p.width || 10,
        height: p.height || 10,
        length: p.length || 10,
        weight: p.weight || 0.5,
        insurance_value: p.price,
        quantity: p.qty
      }))
    };

    // Use sandbox environment for testing by default
    const response = await axios.post(
      'https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate',
      payload,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'MinhaLoja (suporte@minhaloja.com.br)'
        }
      }
    );

    res.json(response.data);
  } catch (error: any) {
    console.error('Shipping calculate error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Erro ao calcular frete' });
  }
});

// -- Vite / Static Fallback --
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
