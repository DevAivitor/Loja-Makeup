import React, { useState, useMemo } from 'react';
import { Order, StoreSettings } from '../types';
import { Search, Filter, Printer, MessageSquare, Copy, Eye, RefreshCw, Box, Check, X, Clock, Package, TrendingUp, Users, ShoppingBag, MapPin, Store as StoreIcon, Bike, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OrdersDashboardProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: string) => void;
  settings: StoreSettings;
}

const STATUS_COLORS: Record<string, string> = {
  'Aguardando Pagamento': 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
  'Pago': 'bg-blue-500/20 text-blue-600 border-blue-500/30',
  'Separando': 'bg-orange-500/20 text-orange-600 border-orange-500/30',
  'Enviado': 'bg-purple-500/20 text-purple-600 border-purple-500/30',
  'Finalizado': 'bg-green-500/20 text-green-600 border-green-500/30',
  'Cancelado': 'bg-red-500/20 text-red-600 border-red-500/30'
};

const STATUS_OPTIONS = [
  'Aguardando Pagamento',
  'Pago',
  'Separando',
  'Enviado',
  'Finalizado',
  'Cancelado'
];

export default function OrdersDashboard({ orders, onUpdateOrderStatus, settings }: OrdersDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [dateFilter, setDateFilter] = useState('Todos');
  const [sortBy, setSortBy] = useState('Mais recentes');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // Memos for dashboard stats
  const customerInfo = useMemo(() => {
    return (order: any) => {
      if (typeof order.customer === 'string') {
        return { name: order.customer, phone: '', email: '', cpf: '' };
      }
      return order.customer || { name: 'Cliente Anônimo', phone: '', email: '', cpf: '' };
    };
  }, []);

  const parseOrderDate = useMemo(() => {
    return (dateStr: string | undefined) => {
      if (!dateStr) return new Date();
      // handle "DD/MM/YYYY, HH:MM:SS" or "DD/MM/YYYY HH:MM:SS"
      const parts = dateStr.split(/[\s,]+/);
      if (parts.length >= 1 && parts[0].includes('/')) {
        const [day, month, year] = parts[0].split('/');
        const timeParts = parts[1] ? parts[1].split(':') : ['0','0','0'];
        return new Date(Number(year), Number(month) - 1, Number(day), Number(timeParts[0]), Number(timeParts[1]), Number(timeParts[2]||0));
      }
      // fallback
      return new Date(dateStr);
    };
  }, []);

  const stats = useMemo(() => {
    const today = new Date().setHours(0,0,0,0);
    const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    
    let aguardando = 0, emPreparacao = 0, aguardandoEnvio = 0, enviado = 0, finalizados = 0;
    let vendasHoje = 0, vendasMes = 0;
    const clientes = new Set();

    orders.forEach(o => {
      const orderDate = parseOrderDate(o.date);
      const isToday = orderDate.setHours(0,0,0,0) === today;
      const isThisMonth = orderDate.getTime() >= thisMonth;

      const cust = customerInfo(o);
      clientes.add(cust.email || cust.phone);

      if (o.status === 'Aguardando Pagamento') aguardando++;
      if (o.status === 'Pago' || o.status === 'Separando') emPreparacao++;
      if (o.status === 'Enviado') enviado++;
      if (o.status === 'Finalizado') finalizados++;

      if (o.status !== 'Cancelado' && o.status !== 'Aguardando Pagamento') {
        if (isToday) vendasHoje += o.total;
        if (isThisMonth) vendasMes += o.total;
      }
    });

    return {
      aguardando, emPreparacao, enviado, finalizados,
      vendasHoje, vendasMes, totalPedidos: orders.length, clientes: clientes.size
    };
  }, [orders]);

  // Filtering and Sorting
  const filteredOrders = useMemo(() => {
    let filtered = orders.filter(o => {
      // Search
      const searchLower = searchTerm.toLowerCase();
      const cust = customerInfo(o);
      const matchesSearch = 
        o.id.toLowerCase().includes(searchLower) ||
        cust.name.toLowerCase().includes(searchLower) ||
        (cust.phone || '').includes(searchLower) ||
        (cust.cpf || '').includes(searchLower) ||
        (o.address?.city || '').toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // Status Filter
      if (statusFilter !== 'Todos' && o.status !== statusFilter) return false;

      // Date Filter
      const orderDate = parseOrderDate(o.date);
      const today = new Date();
      if (dateFilter === 'Hoje') {
        if (orderDate.setHours(0,0,0,0) !== today.setHours(0,0,0,0)) return false;
      } else if (dateFilter === 'Esta semana') {
        const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
        if (orderDate < firstDay) return false;
      } else if (dateFilter === 'Este mês') {
        if (orderDate.getMonth() !== today.getMonth() || orderDate.getFullYear() !== today.getFullYear()) return false;
      }

      return true;
    });

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'Mais recentes': return parseOrderDate(b.date).getTime() - parseOrderDate(a.date).getTime();
        case 'Mais antigos': return parseOrderDate(a.date).getTime() - parseOrderDate(b.date).getTime();
        case 'Maior valor': return b.total - a.total;
        case 'Menor valor': return a.total - b.total;
        case 'Nome do cliente': return customerInfo(a).name.localeCompare(customerInfo(b).name);
        default: return 0;
      }
    });

    return filtered;
  }, [orders, searchTerm, statusFilter, dateFilter, sortBy]);

  const handlePrint = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const cust = customerInfo(order);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Pedido #${order.id.slice(-6)}</title>
        <style>
          body { font-family: 'Inter', sans-serif; color: #3A261A; margin: 0; padding: 40px; }
          .header { text-align: center; border-bottom: 2px solid #E6D8C9; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; font-style: italic; color: #D4A017; margin-bottom: 5px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .info-box { border: 1px solid #E6D8C9; padding: 15px; border-radius: 8px; }
          .info-box h3 { margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; color: #8A7360; }
          .info-box p { margin: 5px 0; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { text-align: left; padding: 12px; border-bottom: 2px solid #E6D8C9; color: #8A7360; text-transform: uppercase; font-size: 12px; }
          td { padding: 12px; border-bottom: 1px solid #E6D8C9; font-size: 14px; }
          .totals { width: 300px; margin-left: auto; }
          .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
          .totals-row.grand { font-size: 18px; font-weight: bold; border-top: 2px solid #E6D8C9; padding-top: 15px; margin-top: 10px; }
          @media print {
            body { padding: 0; }
            @page { margin: 1cm; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">${settings.name}</div>
          <h2>Detalhes do Pedido #${order.id.slice(-6)}</h2>
          <p>Data: ${order.date}</p>
        </div>
        
        <div class="info-grid">
          <div class="info-box">
            <h3>Cliente</h3>
            <p><strong>Nome:</strong> ${cust.name}</p>
            <p><strong>Email:</strong> ${cust.email || 'Não informado'}</p>
            <p><strong>Telefone:</strong> ${cust.phone || 'Não informado'}</p>
            <p><strong>CPF:</strong> ${cust.cpf || 'Não informado'}</p>
          </div>
          <div class="info-box">
            <h3>Entrega & Pagamento</h3>
            <p><strong>Método de Entrega:</strong> ${order.deliveryMethod === 'store' ? 'Retirar na Loja' : 'Transportadora'}</p>
            <p><strong>Método de Pagamento:</strong> ${order.paymentMethod === 'pix' ? 'PIX' : 'Cartão de Crédito'}</p>
            <p><strong>Status:</strong> ${order.status}</p>
            ${order.address ? `
              <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;">
                <strong>Endereço:</strong><br/>
                ${order.address.street}, ${order.address.number}<br/>
                ${order.address.neighborhood} - ${order.address.city}/${order.address.state}<br/>
                CEP: ${order.address.cep}
              </div>
            ` : ''}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Produto</th>
              <th>Ref</th>
              <th>Qtd</th>
              <th style="text-align: right">Preço Unit.</th>
              <th style="text-align: right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${(order.items || []).map((item: any) => {
              // Extract qty if format is "Item (x2)", else assume 1
              const qtyMatch = typeof item === 'string' ? item.match(/\(x(\d+)\)/) : null;
              const qty = qtyMatch ? parseInt(qtyMatch[1]) : 1;
              const name = typeof item === 'string' ? item.replace(/\s*\(x\d+\)/, '') : (item.name || 'Produto');
              // We don't have individual prices stored well in old orders, but we can display the string
              return `
                <tr>
                  <td>${name}</td>
                  <td>-</td>
                  <td>${qty}</td>
                  <td style="text-align: right">-</td>
                  <td style="text-align: right">-</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-row">
            <span>Subtotal:</span>
            <span>R$ ${order.total.toFixed(2).replace('.', ',')}</span>
          </div>
          <div class="totals-row">
            <span>Frete:</span>
            <span>-</span>
          </div>
          <div class="totals-row grand">
            <span>Total Gasto:</span>
            <span>R$ ${order.total.toFixed(2).replace('.', ',')}</span>
          </div>
        </div>
        
        <script>
          window.onload = () => {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const copyAddress = (order: Order) => {
    if (!order.address) return;
    const { street, number, complement, neighborhood, city, state, cep } = order.address;
    const addressStr = `${street}, ${number}${complement ? ' - ' + complement : ''}\n${neighborhood} - ${city}/${state}\nCEP: ${cep}`;
    navigator.clipboard.writeText(addressStr);
    alert('Endereço copiado!');
  };

  const sendWhatsApp = (phone: string) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanPhone}`, '_blank');
  };

  const [visibleCount, setVisibleCount] = useState(10);

  // Reset pagination when filters change
  React.useEffect(() => {
    setVisibleCount(10);
  }, [searchTerm, statusFilter, dateFilter, sortBy]);

  const visibleOrders = filteredOrders.slice(0, visibleCount);

  return (
    <div className="space-y-6">
      {/* Dashboard Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[rgba(58,38,26,0.92)] backdrop-blur-sm p-4 rounded-[18px] shadow-[0_10px_25px_rgba(0,0,0,0.25)] border border-[#D4A017]/18 flex items-center gap-4 transition-all duration-250 hover:border-[#D4A017]/40">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4A017] to-[#F2C94C] flex items-center justify-center text-white shadow-lg">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-[#CFC3B6] font-bold uppercase tracking-wider">Vendas Hoje</p>
            <p className="text-xl font-bold text-[#D4A017] drop-shadow-[0_0_8px_rgba(212,160,23,0.3)]">R$ {stats.vendasHoje.toFixed(2).replace('.', ',')}</p>
          </div>
        </div>
        <div className="bg-[rgba(58,38,26,0.92)] backdrop-blur-sm p-4 rounded-[18px] shadow-[0_10px_25px_rgba(0,0,0,0.25)] border border-[#D4A017]/18 flex items-center gap-4 transition-all duration-250 hover:border-[#D4A017]/40">
          <div className="w-12 h-12 rounded-full bg-[#4A3021] border border-[#D4A017]/30 flex items-center justify-center text-[#F2C94C] shadow-lg">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-[#CFC3B6] font-bold uppercase tracking-wider">Vendas Mês</p>
            <p className="text-xl font-bold text-[#F1E4D3]">R$ {stats.vendasMes.toFixed(2).replace('.', ',')}</p>
          </div>
        </div>
        <div className="bg-[rgba(58,38,26,0.92)] backdrop-blur-sm p-4 rounded-[18px] shadow-[0_10px_25px_rgba(0,0,0,0.25)] border border-[#D4A017]/18 flex items-center gap-4 transition-all duration-250 hover:border-[#D4A017]/40">
          <div className="w-12 h-12 rounded-full bg-[#4A3021] border border-[#D4A017]/30 flex items-center justify-center text-[#F2C94C] shadow-lg">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-[#CFC3B6] font-bold uppercase tracking-wider">Total Pedidos</p>
            <p className="text-xl font-bold text-[#F1E4D3]">{stats.totalPedidos}</p>
          </div>
        </div>
        <div className="bg-[rgba(58,38,26,0.92)] backdrop-blur-sm p-4 rounded-[18px] shadow-[0_10px_25px_rgba(0,0,0,0.25)] border border-[#D4A017]/18 flex items-center gap-4 transition-all duration-250 hover:border-[#D4A017]/40">
          <div className="w-12 h-12 rounded-full bg-[#4A3021] border border-[#D4A017]/30 flex items-center justify-center text-[#F2C94C] shadow-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-[#CFC3B6] font-bold uppercase tracking-wider">Clientes</p>
            <p className="text-xl font-bold text-[#F1E4D3]">{stats.clientes}</p>
          </div>
        </div>
      </div>

      {/* Status summary */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        <div className="flex items-center gap-2 bg-[rgba(58,38,26,0.92)] px-4 py-2 rounded-lg border border-[#D4A017]/30 whitespace-nowrap shadow-sm hover:border-[#D4A017]/60 transition-colors">
          <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
          <span className="text-xs font-bold uppercase tracking-wider text-yellow-500">Aguardando ({stats.aguardando})</span>
        </div>
        <div className="flex items-center gap-2 bg-[rgba(58,38,26,0.92)] px-4 py-2 rounded-lg border border-[#D4A017]/30 whitespace-nowrap shadow-sm hover:border-[#D4A017]/60 transition-colors">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-500">Em preparação ({stats.emPreparacao})</span>
        </div>
        <div className="flex items-center gap-2 bg-[rgba(58,38,26,0.92)] px-4 py-2 rounded-lg border border-[#D4A017]/30 whitespace-nowrap shadow-sm hover:border-[#D4A017]/60 transition-colors">
          <span className="w-2 h-2 rounded-full bg-purple-500"></span>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-500">Enviado ({stats.enviado})</span>
        </div>
        <div className="flex items-center gap-2 bg-green-500/10 px-4 py-2 rounded-lg border border-green-500/20 whitespace-nowrap">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          <span className="text-xs font-semibold text-green-700">Finalizados ({stats.finalizados})</span>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-[rgba(58,38,26,0.92)] backdrop-blur-sm p-4 rounded-[18px] shadow-[0_10px_25px_rgba(0,0,0,0.25)] border border-[#D4A017]/18 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D4A017]" />
          <input 
            type="text" 
            placeholder="Pesquisar pedido, cliente, CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-[#4A3021]/50 border border-[#D4A017]/30 text-white placeholder-[#CFC3B6] rounded-xl outline-none focus:border-[#D4A017] focus:bg-[#4A3021] text-sm transition-all shadow-inner"
          />
        </div>
        
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-[#4A3021]/50 border border-[#D4A017]/30 text-white rounded-xl outline-none focus:border-[#D4A017] text-sm cursor-pointer shadow-inner hover:border-[#D4A017]/60 transition-all appearance-none pr-8 relative"
          >
            <option value="Todos" className="bg-[#2B170F]">Todos os Status</option>
            {STATUS_OPTIONS.map(opt => <option key={opt} value={opt} className="bg-[#2B170F]">{opt}</option>)}
          </select>

          <select 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-3 bg-[#4A3021]/50 border border-[#D4A017]/30 text-white rounded-xl outline-none focus:border-[#D4A017] text-sm cursor-pointer shadow-inner hover:border-[#D4A017]/60 transition-all appearance-none pr-8"
          >
            <option value="Todos" className="bg-[#2B170F]">Todo período</option>
            <option value="Hoje" className="bg-[#2B170F]">Hoje</option>
            <option value="Esta semana" className="bg-[#2B170F]">Esta semana</option>
            <option value="Este mês" className="bg-[#2B170F]">Este mês</option>
          </select>

          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 bg-[#4A3021]/50 border border-[#D4A017]/30 text-white rounded-xl outline-none focus:border-[#D4A017] text-sm cursor-pointer shadow-inner hover:border-[#D4A017]/60 transition-all appearance-none pr-8"
          >
            <option value="Mais recentes" className="bg-[#2B170F]">Mais recentes</option>
            <option value="Mais antigos" className="bg-[#2B170F]">Mais antigos</option>
            <option value="Maior valor" className="bg-[#2B170F]">Maior valor</option>
            <option value="Menor valor" className="bg-[#2B170F]">Menor valor</option>
            <option value="Nome do cliente" className="bg-[#2B170F]">Nome do cliente</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-[rgba(58,38,26,0.92)] backdrop-blur-sm rounded-[18px] border border-[#D4A017]/18">
            <Box className="w-12 h-12 text-[#D4A017]/40 mx-auto mb-4" />
            <p className="text-[#CFC3B6] font-medium">Nenhum pedido encontrado.</p>
          </div>
        ) : (
          <>
            {visibleOrders.map((order) => {
              const cust = customerInfo(order);
              return (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={order.id} 
                className="bg-[rgba(58,38,26,0.92)] backdrop-blur-sm rounded-[18px] border border-[#D4A017]/18 overflow-hidden shadow-[0_10px_25px_rgba(0,0,0,0.25)] hover:border-[#D4A017]/40 transition-all duration-250"
              >
              {/* Card Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 md:p-6 border-b border-[#D4A017]/10 gap-4 bg-black/20">
                <div className="flex items-start md:items-center gap-4 w-full md:w-auto">
                  <div className="hidden md:flex w-10 h-10 bg-gradient-to-br from-[#D4A017] to-[#F2C94C] rounded-xl items-center justify-center text-[#2B170F] shrink-0 shadow-[0_4px_12px_rgba(212,160,23,0.3)]">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col w-full md:w-auto">
                    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 mb-1 md:mb-0">
                      <h4 className="font-main font-bold text-xl md:text-lg text-[#F1E4D3]">
                        Pedido #{order.id.slice(-6).toUpperCase()}
                      </h4>
                      <span className="text-xs md:text-[10px] font-medium text-[#CFC3B6] md:bg-black/30 md:px-2.5 md:py-0.5 md:rounded-full md:border md:border-[#D4A017]/20 w-fit">
                        {order.date}
                      </span>
                    </div>
                    <p className="text-base md:text-sm text-[#D4A017] font-medium leading-tight mt-0.5">{cust.name}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between sm:justify-end gap-3 w-full md:w-auto pt-3 md:pt-0 mt-2 md:mt-0 border-t border-white/5 md:border-none">
                  <select
                    value={order.status}
                    onChange={(e) => onUpdateOrderStatus(order.id, e.target.value)}
                    className="w-full sm:w-auto text-xs md:text-[10px] font-bold uppercase tracking-wider px-4 py-2.5 md:py-1.5 rounded-full outline-none border cursor-pointer bg-[#2B170F] text-[#F1E4D3] border-[#D4A017]/30 hover:border-[#D4A017]/60 transition-colors shadow-inner appearance-none pr-8 relative"
                  >
                    {STATUS_OPTIONS.map(opt => <option key={opt} value={opt} className="bg-[#2B170F]">{opt}</option>)}
                  </select>
                  <span className="font-main text-2xl md:text-3xl font-bold text-[#D4A017] drop-shadow-[0_0_10px_rgba(212,160,23,0.4)]">
                    R$ {order.total.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 border-b border-[#D4A017]/20 pb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#D4A017]"></div>
                    <h5 className="text-[11px] font-bold uppercase tracking-widest text-[#D4A017]">Detalhes do Cliente</h5>
                  </div>
                  <div className="text-sm space-y-2">
                    <p className="text-[#F1E4D3]"><span className="font-medium text-[#CFC3B6]">Telefone:</span> {cust.phone || 'N/A'}</p>
                    <p className="text-[#F1E4D3]"><span className="font-medium text-[#CFC3B6]">CPF:</span> {cust.cpf || 'N/A'}</p>
                    <p className="text-[#F1E4D3]"><span className="font-medium text-[#CFC3B6]">Email:</span> {cust.email || 'N/A'}</p>
                  </div>

                  <div className="flex items-center gap-3 border-b border-[#D4A017]/20 pb-2 pt-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#D4A017]"></div>
                    <h5 className="text-[11px] font-bold uppercase tracking-widest text-[#D4A017]">Logística & Pagamento</h5>
                  </div>
                  <div className="text-sm space-y-2">
                    <p className="text-[#F1E4D3]"><span className="font-medium text-[#CFC3B6]">Entrega:</span> {order.deliveryType === 'pickup' || order.deliveryMethod === 'store' ? 'Retirar na Loja' : 'Transportadora/Motoboy'}</p>
                    <p className="text-[#F1E4D3]"><span className="font-medium text-[#CFC3B6]">Pagamento:</span> {order.paymentMethod === 'pix' ? 'PIX' : 'Cartão'}</p>
                    {order.paymentId && <p className="text-xs text-[#CFC3B6] mt-1 font-mono bg-black/20 p-2 rounded-lg break-all border border-white/5">ID Ref: {order.paymentId}</p>}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 border-b border-[#D4A017]/20 pb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#D4A017]"></div>
                    <h5 className="text-[11px] font-bold uppercase tracking-widest text-[#D4A017]">Endereço & Entrega</h5>
                  </div>
                  
                  {!order.address && (order.deliveryType === 'pickup' || order.deliveryMethod === 'store') ? (
                    <div className="text-sm space-y-3 bg-[#2B170F]/50 p-4 rounded-xl border border-[#D4A017]/20 shadow-inner">
                      <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#D4A017] to-[#F2C94C] px-3 py-1.5 rounded text-[#2B170F] font-bold">
                        <StoreIcon className="w-4 h-4" />
                        <span>Retirada na Loja</span>
                      </div>
                      <div className="mt-2 space-y-1">
                        <p className="text-[#CFC3B6] text-xs font-bold uppercase tracking-wider">Endereço da Loja:</p>
                        <p className="text-white">Av. Macário Subtil de Oliveira</p>
                        <p className="text-[#F1E4D3]">Galeria V3</p>
                        <p className="text-[#F1E4D3]">Centro</p>
                        <p className="text-[#F1E4D3]">CEP: 78785-000</p>
                      </div>
                      <div className="mt-2 space-y-1 pt-2 border-t border-[#D4A017]/10">
                        <p className="text-[#CFC3B6] text-xs font-bold uppercase tracking-wider">Status:</p>
                        <p className="text-[#D4A017] font-medium">{order.status === 'Aguardando Pagamento' ? 'Aguardando pagamento' : 'Aguardando retirada'}</p>
                      </div>
                    </div>
                  ) : order.shippingDetails?.company?.toLowerCase().includes('motoboy') ? (
                    <div className="text-sm space-y-3 bg-[#2B170F]/50 p-4 rounded-xl border border-[#D4A017]/20 shadow-inner">
                      <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#D4A017] to-[#F2C94C] px-3 py-1.5 rounded text-[#2B170F] font-bold">
                        <Bike className="w-4 h-4" />
                        <span>Entrega via Motoboy</span>
                      </div>
                      <div className="mt-2 space-y-1">
                        <p className="text-white font-medium">{order.address?.street || 'N/A'}, {order.address?.number || 'N/A'}</p>
                        {order.address?.complement && <p className="text-[#F1E4D3]">Complemento: {order.address.complement}</p>}
                        <p className="text-[#F1E4D3]">Bairro: {order.address?.district || order.address?.neighborhood || 'N/A'}</p>
                        <p className="text-[#F1E4D3]">{order.address?.city || 'N/A'} - {order.address?.state || 'N/A'}</p>
                        <p className="text-[#F1E4D3]">CEP {order.address?.cep || 'N/A'}</p>
                        {order.address?.reference && <p className="text-[#F1E4D3] text-xs italic opacity-80 mt-1">Ref: {order.address.reference}</p>}
                      </div>
                      <div className="mt-2 space-y-1 pt-2 border-t border-[#D4A017]/10">
                        <p className="text-[#F1E4D3]"><span className="text-[#CFC3B6] font-medium">Valor do frete:</span> R$ {Number(order.shippingDetails?.price || 0).toFixed(2).replace('.', ',')}</p>
                        <p className="text-[#F1E4D3]"><span className="text-[#CFC3B6] font-medium">Previsão:</span> 1 dia útil</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm space-y-3 bg-[#2B170F]/50 p-4 rounded-xl border border-[#D4A017]/20 shadow-inner">
                      <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#D4A017] to-[#F2C94C] px-3 py-1.5 rounded text-[#2B170F] font-bold">
                        <Truck className="w-4 h-4" />
                        <span>Transportadora</span>
                      </div>
                      <div className="mt-2 space-y-1">
                        <p className="text-[#F1E4D3]"><span className="text-[#CFC3B6] font-medium">Nome:</span> {order.shippingDetails?.company || 'Transportadora Padrão'}</p>
                        {order.shippingDetails?.trackingCode && <p className="text-[#F1E4D3]"><span className="text-[#CFC3B6] font-medium">Rastreio:</span> {order.shippingDetails.trackingCode}</p>}
                      </div>
                      <div className="mt-2 space-y-1 pt-2 border-t border-[#D4A017]/10">
                        <p className="text-white font-medium">{order.address?.street || 'N/A'}, {order.address?.number || 'N/A'}</p>
                        {order.address?.complement && <p className="text-[#F1E4D3]">Complemento: {order.address.complement}</p>}
                        <p className="text-[#F1E4D3]">Bairro: {order.address?.district || order.address?.neighborhood || 'N/A'}</p>
                        <p className="text-[#F1E4D3]">{order.address?.city || 'N/A'} - {order.address?.state || 'N/A'}</p>
                        <p className="text-[#F1E4D3]">CEP {order.address?.cep || 'N/A'}</p>
                        {order.address?.reference && <p className="text-[#F1E4D3] text-xs italic opacity-80 mt-1">Ref: {order.address.reference}</p>}
                      </div>
                      <div className="mt-2 space-y-1 pt-2 border-t border-[#D4A017]/10">
                        <p className="text-[#F1E4D3]"><span className="text-[#CFC3B6] font-medium">Valor do frete:</span> R$ {Number(order.shippingDetails?.price || 0).toFixed(2).replace('.', ',')}</p>
                        <p className="text-[#F1E4D3]"><span className="text-[#CFC3B6] font-medium">Prazo:</span> {order.shippingDetails?.deliveryTime || 'N/A'} dias úteis</p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-3">
                    <button onClick={() => handlePrint(order)} className="flex-1 flex justify-center items-center gap-2 px-5 py-3 sm:py-2.5 bg-gradient-to-br from-[#D4A017] to-[#F2C94C] rounded-xl text-sm font-bold text-[#2B170F] shadow-[0_4px_12px_rgba(212,160,23,0.3)] hover:shadow-[0_6px_16px_rgba(212,160,23,0.4)] md:hover:brightness-110 active:scale-95 transition-all duration-250">
                      <Printer className="w-4 h-4" /> Imprimir
                    </button>
                    {cust.phone && (
                      <button onClick={() => sendWhatsApp(cust.phone!)} className="flex-1 flex justify-center items-center gap-2 px-4 py-3 sm:py-2.5 bg-[#25D366]/10 border border-[#25D366]/30 rounded-xl text-sm font-bold text-[#25D366] md:hover:bg-[#25D366]/20 md:hover:border-[#25D366]/50 active:bg-[#25D366]/30 transition-all duration-250">
                        <MessageSquare className="w-4 h-4" /> WhatsApp
                      </button>
                    )}
                    {order.address && (
                      <button onClick={() => copyAddress(order)} className="flex-1 flex justify-center items-center gap-2 px-4 py-3 sm:py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white md:hover:bg-white/10 active:bg-white/20 transition-all duration-250">
                        <Copy className="w-4 h-4" /> Copiar Endereço
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Products Toggle */}
              <div className="border-t border-[#D4A017]/10">
                <button 
                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  className="w-full px-5 py-4 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-[#D4A017] hover:bg-[#D4A017]/5 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  {expandedOrder === order.id ? 'Ocultar Produtos' : 'Ver Produtos'}
                </button>
                
                <AnimatePresence>
                  {expandedOrder === order.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-black/20"
                    >
                      <div className="p-6 border-t border-[#D4A017]/10">
                        <ul className="space-y-3">
                          {(order.items || []).map((item, idx) => (
                            <li key={idx} className="flex justify-between items-center bg-[#2B170F]/60 p-4 rounded-xl border border-[#D4A017]/10 shadow-sm text-[#F1E4D3]">
                              <span className="text-sm font-medium">{item}</span>
                            </li>
                          ))}
                        </ul>
                        {/* Financial summary inside the order */}
                        <div className="mt-5 p-5 bg-[#2B170F]/60 rounded-xl border border-[#D4A017]/20 flex flex-col md:flex-row justify-between md:items-center gap-6 shadow-inner">
                            <div className="flex flex-col gap-1.5 text-sm">
                                <span className="text-[#CFC3B6] font-bold uppercase text-[10px] tracking-wider">Resumo Financeiro</span>
                                <div className="flex gap-4 items-center mt-1">
                                    <span className="text-[#F1E4D3]">Total Pago: <strong className="text-2xl text-[#D4A017] ml-2 font-bold drop-shadow-[0_0_8px_rgba(212,160,23,0.3)]">R$ {order.total.toFixed(2).replace('.', ',')}</strong></span>
                                </div>
                            </div>
                            <div className="flex flex-col md:items-end gap-2.5">
                                {/* Timeline component (Simplified) */}
                                <span className="text-[#CFC3B6] font-bold uppercase text-[10px] tracking-wider">Linha do Tempo</span>
                                <div className="flex items-center gap-2 text-xs font-bold">
                                    <span className="text-green-500">Criado</span>
                                    <span className="text-[#D4A017]/30">→</span>
                                    <span className={order.status !== 'Aguardando Pagamento' ? 'text-green-500' : 'text-[#CFC3B6]'}>Pago</span>
                                    <span className="text-[#D4A017]/30">→</span>
                                    <span className={['Enviado', 'Finalizado'].includes(order.status) ? 'text-green-500' : 'text-[#CFC3B6]'}>Enviado</span>
                                </div>
                            </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              </motion.div>
              );
            })}
            
            {visibleCount < filteredOrders.length && (
              <div className="flex justify-center pt-6">
                <button
                  onClick={() => setVisibleCount(prev => prev + 10)}
                  className="px-8 py-3 bg-transparent border border-[#D4A017] text-[#D4A017] font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-[#D4A017] hover:text-[#2B170F] shadow-[0_4px_12px_rgba(212,160,23,0.1)] hover:shadow-[0_4px_16px_rgba(212,160,23,0.3)] transition-all duration-250"
                >
                  Carregar Mais
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
