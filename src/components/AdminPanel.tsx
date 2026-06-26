import React, { useState, useMemo } from 'react';
import { Product, Order, StoreSettings, Category } from '../types';
import { CATEGORIES, CATEGORY_ICONS } from '../data';
import { X, Box, List, Settings, Trash2, Plus, Edit2, Key, Info, Check, Save, Upload, Tag, LogIn, LogOut, Loader2, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import OrdersDashboard from './OrdersDashboard';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  orders: Order[];
  settings: StoreSettings;
  isAdmin: boolean;
  login: () => void;
  logout: () => void;
  user: any;
  onAddProduct: (prod: Omit<Product, 'id'>) => void;
  onUpdateProduct: (id: number, prod: Omit<Product, 'id'>) => void;
  onDeleteProduct: (id: number) => void;
  onSaveSettings: (settings: StoreSettings) => void;
  categories: any[];
  onAddCategory: (category: { name: string; label: string; emoji: string }) => void;
  onUpdateCategory: (name: string, updatedCategory: { name: string; label: string; emoji: string }) => void;
  onDeleteCategory: (name: string) => void;
  onUpdateOrderStatus: (orderId: string, status: string) => void;
  initialTab?: 'products' | 'orders' | 'settings' | 'categories';
}

export default function AdminPanel({
  isOpen,
  onClose,
  products,
  orders,
  settings,
  isAdmin,
  login,
  logout,
  user,
  categories,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onSaveSettings,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onUpdateOrderStatus,
  initialTab
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'settings' | 'categories'>(initialTab || 'products');

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab || 'products');
    }
  }, [isOpen, initialTab]);
  
  // Product Form state
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodCat, setProdCat] = useState<string>('Batom');
  const [prodDesc, setProdDesc] = useState('');
  const [prodImg, setProdImg] = useState('');
  const [prodBadge, setProdBadge] = useState<string>('');

  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      setProdImg(downloadURL);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Erro ao fazer upload da imagem. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };
  // Category Form state
  const [editingCategoryName, setEditingCategoryName] = useState<string | null>(null);
  const [catNameInput, setCatNameInput] = useState('');
  const [catLabelInput, setCatLabelInput] = useState('');
  const [catEmojiInput, setCatEmojiInput] = useState('');

  // Settings State
  const [storePhone, setStorePhone] = useState(settings.phone);
  const [storeName, setStoreName] = useState(settings.name);
  const [storeSlogan, setStoreSlogan] = useState(settings.slogan);
  const [storeIg, setStoreIg] = useState(settings.ig);
  const [newPassword, setNewPassword] = useState('');

  const headerStats = useMemo(() => {
    // Use parseOrderDate equivalent here or just rough parse
    // Actually we can just copy parseOrderDate here
    const today = new Date().setHours(0,0,0,0);
    let pendentes = 0;
    let pagosHoje = 0;
    let valorHoje = 0;
    
    orders.forEach(o => {
      let orderDate = new Date();
      if (o.date) {
        const parts = o.date.split(/[\s,]+/);
        if (parts.length >= 1 && parts[0].includes('/')) {
            const [day, month, year] = parts[0].split('/');
            orderDate = new Date(Number(year), Number(month) - 1, Number(day));
        } else {
            orderDate = new Date(o.date);
        }
      }
      
      const isToday = orderDate.setHours(0,0,0,0) === today;
      
      if (o.status === 'Aguardando Pagamento') pendentes++;
      if (isToday && o.status !== 'Aguardando Pagamento' && o.status !== 'Cancelado') {
          pagosHoje++;
          valorHoje += o.total;
      }
    });

    return { pendentes, pagosHoje, valorHoje };
  }, [orders]);

  if (!isOpen) return null;

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) return;

    const productPayload = {
      name: prodName.trim(),
      cat: prodCat,
      desc: prodDesc.trim(),
      price: 10,
      img: prodImg.trim(),
      badge: prodBadge
    };

    if (editingProductId !== null) {
      onUpdateProduct(editingProductId, productPayload);
      setEditingProductId(null);
    } else {
      onAddProduct(productPayload);
    }

    // Reset Form
    setProdName('');
    setProdDesc('');
    setProdImg('');
    setProdBadge('');
  };

  const handleEditInit = (product: Product) => {
    setEditingProductId(product.id);
    setProdName(product.name);
    setProdCat(product.cat);
    setProdDesc(product.desc);
    setProdImg(product.img);
    setProdBadge(product.badge);
  };

  const handleCancelEdit = () => {
    setEditingProductId(null);
    setProdName('');
    setProdDesc('');
    setProdImg('');
    setProdBadge('');
  };

  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const settingsPayload: StoreSettings = {
      phone: storePhone.trim(),
      name: storeName.trim(),
      slogan: storeSlogan.trim(),
      ig: storeIg.trim(),
      ...(newPassword.trim() ? { password: newPassword.trim() } : {})
    };

    onSaveSettings(settingsPayload);
    setNewPassword('');
  };


  return (
    <div className="fixed inset-0 z-300 flex items-start justify-center p-0 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer z-0" />

      {/* Main Admin Panel Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-6xl rounded-none sm:rounded-[24px] shadow-2xl z-10 border border-[#D4A017]/20 h-screen sm:h-auto sm:max-h-[90vh] my-0 sm:my-8 flex flex-col overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #2B170F 0%, #4A3021 35%, #8A6A4A 70%, #F3E8D8 100%)' }}
      >
        {/* Navigation Bar - Top Sticky */}
        <div className="bg-[#2B170F]/80 backdrop-blur-md flex flex-col px-6 md:px-8 py-4 border-b border-[#D4A017]/20 shrink-0 sticky top-0 z-20">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center justify-between w-full md:w-auto">
                <div className="flex items-center gap-3">
                  <span className="font-logo italic text-2xl font-semibold tracking-[0.03em] text-[#D4A017]">
                    {settings.name}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-[#F1E4D3] tracking-widest bg-white/10 px-2.5 py-1 rounded hidden sm:block border border-white/5">
                    Painel Administrativo
                  </span>
                </div>
                <button onClick={onClose} className="font-main font-semibold md:hidden w-8 h-8 rounded-full bg-white/10 text-white hover:bg-[#D4A017] flex items-center justify-center transition-all cursor-pointer" >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {!isAdmin ? null : (
                <div className="flex overflow-x-auto md:flex-wrap md:flex-nowrap items-center gap-3 md:gap-4 w-full md:w-auto scrollbar-none pb-2 md:pb-0 snap-x">
                    <div className="flex shrink-0 items-center gap-3 bg-[rgba(58,38,26,0.92)] backdrop-blur-sm px-4 py-2.5 rounded-xl border border-[#D4A017]/20 shadow-lg snap-start">
                        <div className="text-xl">📦</div>
                        <div className="flex flex-col">
                            <span className="text-[9px] uppercase tracking-wider font-bold text-[#CFC3B6]">Pendentes</span>
                            <span className="text-base font-bold text-white">{headerStats.pendentes}</span>
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 bg-[rgba(58,38,26,0.92)] backdrop-blur-sm px-4 py-2.5 rounded-xl border border-[#D4A017]/20 shadow-lg snap-start">
                        <div className="text-xl">💳</div>
                        <div className="flex flex-col">
                            <span className="text-[9px] uppercase tracking-wider font-bold text-[#CFC3B6]">Pagos Hoje</span>
                            <span className="text-base font-bold text-white">{headerStats.pagosHoje}</span>
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 bg-[rgba(58,38,26,0.92)] backdrop-blur-sm px-4 py-2.5 rounded-xl border border-[#D4A017]/20 shadow-lg snap-start">
                        <div className="text-xl">💰</div>
                        <div className="flex flex-col">
                            <span className="text-[9px] uppercase tracking-wider font-bold text-[#CFC3B6]">Vendido Hoje</span>
                            <span className="text-base font-bold text-[#D4A017] drop-shadow-[0_0_8px_rgba(212,160,23,0.4)]">R$ {headerStats.valorHoje.toFixed(2).replace('.', ',')}</span>
                        </div>
                    </div>
                    
                    <div className="flex shrink-0 items-center gap-2 md:ml-auto snap-start pr-4 md:pr-0">
                        <button onClick={() => window.location.reload()} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-white/5 hover:bg-[#D4A017]/20 transition-colors" title="Atualizar dados">
                            <RefreshCw className="w-4 h-4 text-[#D4A017]" /> <span className="hidden sm:inline">Atualizar</span>
                        </button>
                        <button onClick={logout} className="flex md:hidden items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors">
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
              )}
          </div>
          
          {!isAdmin ? null : (
            <div className="flex overflow-x-auto md:flex-wrap items-center gap-2 mt-4 scrollbar-none pb-2 md:pb-0 snap-x">
              <button onClick={() => setActiveTab('products')}
                className={`shrink-0 relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-250 cursor-pointer overflow-hidden snap-start ${
                  activeTab === 'products'
                    ? 'text-white'
                    : 'text-[#CFC3B6] hover:text-[#D4A017] hover:bg-white/5'
                }`}
              >
                {activeTab === 'products' && <motion.div layoutId="activeTabAdmin" className="absolute inset-0 bg-[#D4A017]/20 border border-[#D4A017]/40 rounded-xl" />}
                <Box className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Produtos</span>
              </button>
              <button onClick={() => setActiveTab('orders')}
                className={`shrink-0 relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-250 cursor-pointer overflow-hidden snap-start ${
                  activeTab === 'orders'
                    ? 'text-white'
                    : 'text-[#CFC3B6] hover:text-[#D4A017] hover:bg-white/5'
                }`}
              >
                {activeTab === 'orders' && <motion.div layoutId="activeTabAdmin" className="absolute inset-0 bg-[#D4A017]/20 border border-[#D4A017]/40 rounded-xl" />}
                <List className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Pedidos</span>
              </button>
              <button onClick={() => setActiveTab('settings')}
                className={`shrink-0 relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-250 cursor-pointer overflow-hidden snap-start ${
                  activeTab === 'settings'
                    ? 'text-white'
                    : 'text-[#CFC3B6] hover:text-[#D4A017] hover:bg-white/5'
                }`}
              >
                {activeTab === 'settings' && <motion.div layoutId="activeTabAdmin" className="absolute inset-0 bg-[#D4A017]/20 border border-[#D4A017]/40 rounded-xl" />}
                <Settings className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Config</span>
              </button>
              <button onClick={() => setActiveTab('categories')}
                className={`shrink-0 relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-250 cursor-pointer overflow-hidden snap-start ${
                  activeTab === 'categories'
                    ? 'text-white'
                    : 'text-[#CFC3B6] hover:text-[#D4A017] hover:bg-white/5'
                }`}
              >
                {activeTab === 'categories' && <motion.div layoutId="activeTabAdmin" className="absolute inset-0 bg-[#D4A017]/20 border border-[#D4A017]/40 rounded-xl" />}
                <Tag className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Categorias</span>
              </button>
              <button onClick={logout} className="shrink-0 font-main font-semibold hidden md:flex flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs tracking-wider uppercase transition-all duration-250 cursor-pointer text-[#CFC3B6] hover:text-red-400 hover:bg-red-500/10" >
                <LogOut className="w-4 h-4" /> Sair
              </button>
              <button onClick={onClose} className="shrink-0 font-main font-semibold hidden md:flex w-10 h-10 rounded-full bg-white/10 text-white hover:bg-[#D4A017] items-center justify-center ml-4 transition-all hover:rotate-90 cursor-pointer shadow-lg" aria-label="Fechar painel" >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Admin Body Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          
          {!isAdmin ? (
            <div className="flex flex-col items-center justify-center h-full max-w-sm mx-auto text-center space-y-6">
              <div className="w-20 h-20 bg-brand-gold/20 text-brand-gold rounded-full flex items-center justify-center">
                <Key className="w-10 h-10" />
              </div>
              <div>
                <h3 className="font-main text-2xl font-bold text-brand-chocolate mb-2">Acesso Restrito</h3>
                <p className="text-sm text-brand-chocolate-light/80 mb-6">Você precisa ser um administrador verificado (vitorsori4@gmail.com) para gerenciar o conteúdo desta loja.</p>
                <button onClick={login} className="font-main font-semibold w-full py-4 bg-brand-gold hover:bg-brand-gold-light text-brand-rose rounded-xl text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 shadow-lg cursor-pointer" >
                  <LogIn className="w-4 h-4" /> Entrar com Google
                </button>
                {user && !isAdmin && (
                  <p className="text-xs text-red-500 mt-4 bg-red-100 p-2 rounded">
                    O usuário {user.email} não tem permissão de administrador.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* TAB 1: PRODUCTS */}
          {activeTab === 'products' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Product Edit / Add Form */}
              <div className="lg:col-span-5 bg-brand-cream/30 p-6 rounded-2xl border border-brand-nude-light/60">
                <h3 className="font-main text-xl font-bold text-brand-chocolate mb-5 flex items-center gap-2">
                  {editingProductId !== null ? <Edit2 className="w-5 h-5 text-brand-gold" /> : <Plus className="w-5 h-5 text-brand-gold" />}
                  {editingProductId !== null ? 'Editar Produto' : 'Adicionar Novo Produto'}
                </h3>

                <form onSubmit={handleProductSubmit} className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-nude-dark">
                      Nome do Produto *
                    </label>
                    <input
                      type="text"
                      required
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      placeholder="Ex: Batom Velvet Matte Rose"
                      className="w-full px-4 py-3 text-sm bg-brand-rose border border-brand-nude-light/80 text-brand-gold placeholder:text-brand-chocolate-light/40 rounded-xl outline-none focus:border-brand-gold transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-nude-dark">
                      Categoria *
                    </label>
                    <select
                      value={prodCat}
                      onChange={(e) => setProdCat(e.target.value)}
                      className="w-full px-4 py-3 text-sm bg-brand-rose border border-brand-nude-light/80 text-brand-gold rounded-xl outline-none focus:border-brand-gold transition-colors cursor-pointer"
                    >
                      {categories.filter(c => c.name !== 'Todos').map(c => (
                        <option key={c.name} value={c.name} className="bg-brand-rose text-brand-gold">
                          {c.emoji} {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-nude-dark">
                      Descrição curta *
                    </label>
                    <textarea
                      required
                      value={prodDesc}
                      onChange={(e) => setProdDesc(e.target.value)}
                      rows={3}
                      placeholder="Ex: Textura aveludada, alta cobertura..."
                      className="w-full px-4 py-3 text-sm bg-brand-rose border border-brand-nude-light/80 text-brand-gold placeholder:text-brand-chocolate-light/40 rounded-xl outline-none focus:border-brand-gold transition-colors resize-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-nude-dark">
                      Imagem do Produto
                    </label>
                    
                    {prodImg ? (
                      <div className="relative group rounded-xl overflow-hidden border border-brand-nude-light/60 bg-brand-cream/10 p-2 flex items-center gap-4">
                        <img 
                          src={prodImg} 
                          alt="Preview do produto" 
                          className="w-16 h-16 object-cover rounded-lg border border-brand-nude-light/40"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-brand-chocolate font-medium truncate">Imagem carregada com sucesso!</p>
                          <p className="text-[10px] text-brand-chocolate-light/75">Seu produto já possui uma imagem anexada.</p>
                        </div>
                        <button type="button" onClick={() => setProdImg('')}
                          className="p-2 rounded-lg bg-brand-rose hover:bg-red-950/40 text-brand-gold hover:text-red-400 border border-brand-nude-light/60 transition-all cursor-pointer mr-2"
                          title="Remover imagem"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="relative border-2 border-dashed border-brand-nude-light hover:border-brand-gold/50 bg-brand-cream/10 hover:bg-brand-cream/20 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={isUploading}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer disabled:cursor-not-allowed"
                        />
                        <div className="w-10 h-10 rounded-full bg-brand-rose/60 border border-brand-nude-light flex items-center justify-center text-brand-gold group-hover:scale-110 transition-transform duration-300">
                          {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-brand-chocolate font-bold">
                            {isUploading ? 'Enviando...' : 'Faça o upload da imagem'}
                          </p>
                          <p className="text-[10px] text-brand-chocolate-light/75 mt-0.5">Clique ou arraste o arquivo aqui (PNG, JPG)</p>
                        </div>
                      </label>
                    )}
                    
                    <p className="text-[10px] text-brand-chocolate-light/60 italic leading-tight mt-0.5">
                      Fazer o upload da foto do produto para exibição no catálogo. Deixe vazio para usar o ícone padrão.
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-nude-dark">
                      Badge / Destaque do Produto
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: '', label: 'Nenhum' },
                        { value: 'new', label: '✨ Novidade' },
                        { value: 'hot', label: '🔥 Mais Vendido' },
                        { value: 'last', label: '⏳ Últimas Unidades' }
                      ].map(badgeOpt => (
                        <button key={badgeOpt.value} type="button" onClick={() => setProdBadge(badgeOpt.value)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                            prodBadge === badgeOpt.value
                              ? 'bg-brand-gold border-brand-gold text-brand-rose font-black'
                              : 'bg-brand-rose border-brand-nude-light text-brand-gold hover:border-brand-gold hover:bg-brand-gold/10'
                          }`}
                        >
                          {badgeOpt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-brand-nude-light/40 flex gap-3">
                    <button type="submit" className="font-main font-semibold flex-1 py-3 bg-brand-gold hover:bg-brand-gold-light text-brand-rose rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer " >
                      {editingProductId !== null ? 'Salvar Alterações' : 'Adicionar Produto'}
                    </button>
                    {editingProductId !== null && (
                      <button type="button" onClick={handleCancelEdit} className="font-main font-semibold px-4 py-3 border border-brand-nude-light hover:border-brand-gold rounded-xl text-xs uppercase tracking-wider text-brand-gold hover:bg-brand-gold/10 transition-all cursor-pointer" >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Products List for Management */}
              <div className="lg:col-span-7 flex flex-col h-[500px]">
                <h3 className="font-main text-xl font-bold text-brand-chocolate mb-5">
                  Lista de Produtos ({products.length})
                </h3>

                <div className="flex-1 overflow-y-auto space-y-3.5 pr-2">
                  {products.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-brand-nude border border-dashed border-brand-rose rounded-2xl">
                      <Box className="w-12 h-12 stroke-1 mb-2 opacity-50" />
                      <p className="text-sm font-medium">Nenhum produto cadastrado.</p>
                    </div>
                  ) : (
                    products.map(p => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-4 bg-brand-cream/10 border border-brand-rose/60 rounded-xl hover:bg-brand-cream/30 hover:border-brand-nude/20 transition-all duration-200"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-lg bg-brand-rose/30 overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                            {p.img ? (
                              <img
                                src={p.img}
                                alt={p.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xl filter grayscale opacity-80">
                                {categories.find(c => c.name === p.cat)?.emoji || '💄'}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-main text-base font-medium text-brand-chocolate leading-tight truncate">
                              {p.name}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[9px] font-bold uppercase bg-brand-rose text-brand-nude-dark px-1.5 py-0.5 rounded">
                                {p.cat}
                              </span>
                              {p.badge && (
                                <span className="text-[9px] font-bold uppercase bg-brand-gold-pale text-brand-nude-dark px-1.5 py-0.5 rounded">
                                  {p.badge}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="font-main text-base font-bold text-brand-chocolate mr-2">
                            R$ 10,00
                          </span>
                          <button onClick={() => handleEditInit(p)}
                            className="w-8 h-8 rounded-lg border border-brand-nude-light hover:border-brand-gold hover:bg-brand-gold hover:text-brand-rose flex items-center justify-center text-brand-gold transition-all cursor-pointer"
                            title="Editar produto"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => onDeleteProduct(p.id)}
                            className="w-8 h-8 rounded-lg border border-brand-nude-light hover:border-red-500 hover:bg-red-950/40 hover:text-red-400 flex items-center justify-center text-brand-gold transition-all cursor-pointer"
                            title="Excluir produto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: captureD ORDERS */}
          {activeTab === 'orders' && (
            <OrdersDashboard orders={orders} onUpdateOrderStatus={onUpdateOrderStatus} settings={settings} />
          )}

          {/* TAB 3: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto">
              <h3 className="font-main text-xl font-bold text-brand-chocolate mb-5">
                Configurações do E-commerce
              </h3>

              <form onSubmit={handleSettingsSubmit} className="space-y-5 bg-brand-cream/20 p-6 rounded-2xl border border-brand-nude-light/60">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-nude-dark">
                      Nome da Loja
                    </label>
                    <input
                      type="text"
                      required
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="w-full px-4 py-3 text-sm bg-brand-rose border border-brand-nude-light/80 text-brand-gold rounded-xl outline-none focus:border-brand-gold transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-nude-dark">
                      WhatsApp da Loja (Com DDD) *
                    </label>
                    <input
                      type="text"
                      required
                      value={storePhone}
                      onChange={(e) => setStorePhone(e.target.value)}
                      placeholder="Ex: 5511999999999"
                      className="w-full px-4 py-3 text-sm bg-brand-rose border border-brand-nude-light/80 text-brand-gold rounded-xl outline-none focus:border-brand-gold transition-colors"
                    />
                    <p className="text-[10px] text-brand-chocolate-light/60 mt-0.5">
                      Insira o número completo: DDI(55) + DDD + Telefone.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-nude-dark">
                    Slogan da Loja
                  </label>
                  <input
                    type="text"
                    required
                    value={storeSlogan}
                    onChange={(e) => setStoreSlogan(e.target.value)}
                    className="w-full px-4 py-3 text-sm bg-brand-rose border border-brand-nude-light/80 text-brand-gold rounded-xl outline-none focus:border-brand-gold transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-nude-dark">
                    Instagram da Loja (URL Completa)
                  </label>
                  <input
                    type="url"
                    value={storeIg}
                    onChange={(e) => setStoreIg(e.target.value)}
                    placeholder="Ex: https://instagram.com/makeup_10reais"
                    className="w-full px-4 py-3 text-sm bg-brand-rose border border-brand-nude-light/80 text-brand-gold rounded-xl outline-none focus:border-brand-gold transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5 pt-4 border-t border-brand-nude-light/40">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-nude-dark flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-brand-gold" /> Mudar Senha do Administrador
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Digite a nova senha (deixe vazio para manter a atual)"
                    className="w-full px-4 py-3 text-sm bg-brand-rose border border-brand-nude-light/80 text-brand-gold rounded-xl outline-none focus:border-brand-gold transition-colors"
                  />
                </div>

                <button type="submit" className="font-main font-semibold w-full py-3.5 bg-brand-gold hover:bg-brand-gold-light text-brand-rose rounded-xl text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 shadow-lg cursor-pointer " >
                  <Save className="w-4 h-4" /> Salvar Configurações
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="max-w-xl mx-auto space-y-6">
              <div className="flex justify-between items-baseline mb-4">
                <h3 className="font-main text-xl font-bold text-brand-chocolate">
                  Gerenciar Categorias
                </h3>
              </div>

              <div className="bg-brand-cream/30 p-6 rounded-2xl border border-brand-nude-light/60">
                <h4 className="font-main text-lg font-bold text-brand-chocolate mb-4 flex items-center gap-2">
                  {editingCategoryName ? <Edit2 className="w-5 h-5 text-brand-gold" /> : <Plus className="w-5 h-5 text-brand-gold" />}
                  {editingCategoryName ? 'Editar Categoria' : 'Adicionar Nova Categoria'}
                </h4>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (catNameInput && catLabelInput && catEmojiInput) {
                      if (editingCategoryName) {
                        onUpdateCategory(editingCategoryName, { name: catNameInput, label: catLabelInput, emoji: catEmojiInput });
                        setEditingCategoryName(null);
                      } else {
                        onAddCategory({ name: catNameInput, label: catLabelInput, emoji: catEmojiInput });
                      }
                      setCatNameInput('');
                      setCatLabelInput('');
                      setCatEmojiInput('');
                    }
                  }}
                  className="space-y-4"
                >
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-nude-dark">
                      Nome da Categoria (Interno) *
                    </label>
                    <input
                      value={catNameInput}
                      onChange={(e) => setCatNameInput(e.target.value)}
                      type="text"
                      required
                      placeholder="Ex: Perfume"
                      className="w-full px-4 py-3 text-sm bg-brand-rose border border-brand-nude-light/80 text-brand-gold placeholder:text-brand-chocolate-light/40 rounded-xl outline-none focus:border-brand-gold transition-colors"
                      disabled={!!editingCategoryName} // Disable editing the internal name if it's used as ID
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-nude-dark">
                      Rótulo (Para o Cliente) *
                    </label>
                    <input
                      value={catLabelInput}
                      onChange={(e) => setCatLabelInput(e.target.value)}
                      type="text"
                      required
                      placeholder="Ex: Perfumes & Fragrâncias"
                      className="w-full px-4 py-3 text-sm bg-brand-rose border border-brand-nude-light/80 text-brand-gold placeholder:text-brand-chocolate-light/40 rounded-xl outline-none focus:border-brand-gold transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-nude-dark">
                      Emoji (Ícone) *
                    </label>
                    <input
                      value={catEmojiInput}
                      onChange={(e) => setCatEmojiInput(e.target.value)}
                      type="text"
                      required
                      placeholder="Ex: 🌸"
                      className="w-full px-4 py-3 text-sm bg-brand-rose border border-brand-nude-light/80 text-brand-gold placeholder:text-brand-chocolate-light/40 rounded-xl outline-none focus:border-brand-gold transition-colors"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="submit" className="font-main font-semibold flex-1 py-3.5 bg-brand-gold hover:bg-brand-gold-light text-brand-rose rounded-xl text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 shadow-lg cursor-pointer" >
                      {editingCategoryName ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      {editingCategoryName ? 'Salvar Alterações' : 'Adicionar'}
                    </button>
                    {editingCategoryName && (
                      <button type="button" onClick={() => {
                          setEditingCategoryName(null);
                          setCatNameInput('');
                          setCatLabelInput('');
                          setCatEmojiInput('');
                        }}
                        className="py-3.5 px-4 bg-brand-nude-light text-brand-chocolate rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div className="bg-brand-cream/30 p-6 rounded-2xl border border-brand-nude-light/60">
                <h4 className="font-main text-lg font-bold text-brand-chocolate mb-4">
                  Categorias Atuais ({categories.length})
                </h4>
                <div className="space-y-2">
                  {categories.map((c, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 p-3 bg-brand-rose rounded-xl border border-brand-nude-light/40">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{c.emoji}</span>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-brand-chocolate">{c.label}</span>
                          <span className="text-xs text-brand-chocolate-light">{c.name}</span>
                        </div>
                      </div>
                      {c.name !== 'Todos' && (
                        <div className="flex items-center gap-1">
                          <button onClick={() => {
                              setEditingCategoryName(c.name);
                              setCatNameInput(c.name);
                              setCatLabelInput(c.label);
                              setCatEmojiInput(c.emoji);
                            }}
                            className="p-2 text-brand-chocolate-light hover:text-brand-gold hover:bg-brand-nude-light rounded-lg transition-colors cursor-pointer"
                            title="Editar Categoria"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => onDeleteCategory(c.name)}
                            className="p-2 text-brand-chocolate-light hover:text-red-500 hover:bg-brand-nude-light rounded-lg transition-colors cursor-pointer"
                            title="Remover Categoria"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
            </>
          )}

        </div>
      </motion.div>
    </div>
  );
}
