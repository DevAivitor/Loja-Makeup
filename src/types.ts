export interface Product {
  id: number;
  name: string;
  cat: string;
  desc: string;
  price: number;
  img: string;
  badge: 'new' | 'hot' | 'last' | '' | string;
}

export interface Order {
  id: string;
  date: string;
  items: string[];
  total: number;
  status: 'Aguardando Pagamento' | 'Pago' | 'Preparando' | 'Enviado' | 'Entregue' | 'Retirado na Loja' | string;
  customer?: any; // allows string or object
  deliveryMethod?: 'store' | 'delivery' | string;
  deliveryType?: 'pickup' | 'delivery' | string;
  address?: any;
  deliveryAddress?: any;
  shippingDetails?: any;
  paymentMethod?: string;
  paymentId?: string;
  createdAt?: string; // some orders might have it
}

export interface StoreSettings {
  phone: string;
  name: string;
  slogan: string;
  ig: string;
  password?: string;
}

export type Category = 'Todos' | 'Batom' | 'Base' | 'Sombra' | 'Blush' | 'Delineador' | 'Rímel' | 'Primer' | 'Hidratante' | 'Esponja & Pincel';
