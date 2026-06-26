import React, { useState, useEffect } from 'react';
import { Product, Order, StoreSettings } from './types';
import ProductCard from './components/ProductCard';
import ProductDetailsModal from './components/ProductDetailsModal';
import CartSidebar from './components/CartSidebar';
import CheckoutModal from './components/CheckoutModal';
import AdminPanel from './components/AdminPanel';
import Particles from './components/Particles';
import ScrollFloat from './components/ScrollFloat';
import { useStoreData } from './hooks/useStoreData';
import { 
  Search, 
  ShoppingBag, 
  Lock, 
  Instagram, 
  Sparkles, 
  Check, 
  RotateCcw, 
  Heart, 
  ArrowRight, 
  Tag, 
  Star, 
  MessageSquare,
  X,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const {
    products,
    orders,
    settings,
    categories,
    loading,
    user,
    isAdmin,
    login,
    logout,
    addProduct,
    updateProduct,
    deleteProduct,
    saveSettings,
    saveOrder,
    addCategory,
    updateCategory,
    deleteCategory,
    updateOrderStatus
  } = useStoreData();

  // --- Shopping Cart State ---
  interface CartItem extends Product {
    qty: number;
  }
  const [cart, setCart] = useState<CartItem[]>([]);

  // --- Search & Filter States ---
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // --- Modal & Drawer States ---
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminInitialTab, setAdminInitialTab] = useState<'products' | 'categories' | 'orders' | 'settings'>('products');
  const [logoClicks, setLogoClicks] = useState(0);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Keyboard shortcut to open admin panel (Ctrl + Shift + A or Cmd + Shift + A)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setAdminOpen(true);
        triggerToast('Acesso administrador liberado! 🗝️');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setLogoClicks(prev => {
      const next = prev + 1;
      if (next >= 5) {
        setAdminOpen(true);
        triggerToast('Acesso administrador liberado! 🗝️');
        return 0;
      }
      return next;
    });
  };

  // --- Toast Notification State ---
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // --- Toast Trigger helper ---
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // --- Cart Management Handlers ---
  const handleAddToCart = (id: number) => {
    const prod = products.find(p => p.id === id);
    if (!prod) return;

    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === id);
      if (existing) {
        return prevCart.map(item => 
          item.id === id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prevCart, { ...prod, qty: 1 }];
    });

    triggerToast(`✓ ${prod.name} adicionado ao carrinho!`);
  };

  const handleChangeQty = (id: number, delta: number) => {
    setCart(prevCart => 
      prevCart.map(item => {
        if (item.id === id) {
          const newQty = item.qty + delta;
          return newQty > 0 ? { ...item, qty: newQty } : item;
        }
        return item;
      })
    );
  };

  const handleRemoveFromCart = (id: number) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
    triggerToast('Produto removido do carrinho.');
  };

  // --- Admin Security Handlers ---
  // Direct access is now configured, login modal removed.

  // --- Product Management Handlers (Admin) ---
  const handleAddProduct = async (newProdPayload: Omit<Product, 'id'>) => {
    await addProduct(newProdPayload);
    triggerToast('Produto cadastrado com sucesso! ✓');
  };

  const handleUpdateProduct = async (id: number, updatedPayload: Omit<Product, 'id'>) => {
    await updateProduct(id, updatedPayload);
    triggerToast('Produto atualizado com sucesso! ✓');
  };

  const handleDeleteProduct = async (id: number) => {
    if (window.confirm('Tem certeza de que deseja remover este produto?')) {
      await deleteProduct(id);
      triggerToast('Produto removido com sucesso.');
    }
  };

  const handleSaveSettings = async (updatedSettings: StoreSettings) => {
    await saveSettings(updatedSettings);
    triggerToast('Configurações da loja atualizadas! ✓');
  };

  // --- Image URL filter ---
  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'Todos' || p.cat === selectedCategory;
    const matchesQuery = !searchQuery.trim() || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="min-h-screen flex flex-col selection:bg-brand-gold selection:text-brand-chocolate relative z-10">
      <Particles
        particleColors={['#D4AF37', '#8B5A2B', '#E6C27A']}
        particleCount={isMobile ? 30 : 100}
        particleSpread={isMobile ? 10 : 15}
        speed={0.05}
        particleBaseSize={isMobile ? 40 : 80}
        moveParticlesOnHover={!isMobile}
        alphaParticles={true}
        disableRotation={false}
      />
      
      {/* ── TOP ANNOUNCEMENT BAR ── */}
      <div className="bg-brand-chocolate text-brand-gold py-2.5 px-4 text-center text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 shadow-inner border-b border-brand-chocolate-light overflow-hidden">
        <span className="shimmer-text text-white">✨ TUDO NA LOJA POR APENAS R$10,00 CADA • QUALIDADE PREMIUM ✨</span>
      </div>

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-100 bg-brand-rose border-b border-brand-nude-light/60 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Brand Logo with secret click handler */}
          <a 
            href="#" 
            onClick={handleLogoClick}
            className="flex items-baseline gap-1 group select-none text-[30px] leading-[27px]"
            title={settings.name}
          >
            <ScrollFloat
              animationDuration={1}
              ease='back.inOut(2)'
              stagger={0.03}
              useScrollTrigger={false}
              textClassName="font-logo font-semibold tracking-[0.03em] underline italic text-brand-gold group-hover:text-brand-gold-light transition-colors duration-300"
            >
              {settings.name}
            </ScrollFloat>
          </a>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* Search Toggle Button */}
            <button onClick={() => setSearchOpen(!searchOpen)}
              className="p-3.5 rounded-full bg-brand-rose hover:bg-brand-nude-light text-brand-gold hover:text-brand-gold-light border border-brand-nude-light/60 hover:border-brand-nude/20 shadow-sm transition-all duration-300 cursor-pointer"
              title="Buscar produtos"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Shopping Bag Icon with Count */}
            <button onClick={() => setCartOpen(true)}
              className="p-3.5 rounded-full bg-brand-rose hover:bg-brand-nude-light text-brand-gold hover:text-brand-gold-light border border-brand-nude-light/60 hover:border-brand-nude/20 shadow-sm transition-all duration-300 relative cursor-pointer"
              title="Ver meu carrinho"
            >
              <ShoppingBag className="w-4 h-4" />
              <AnimatePresence>
                {cart.length > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1 bg-brand-gold text-brand-rose text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md border border-brand-rose"
                  >
                    {cart.reduce((s, c) => s + c.qty, 0)}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

          </div>
        </div>
      </header>

      {/* ── EXPANDABLE SEARCH PANEL ── */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-brand-rose border-b border-brand-nude-light/60 overflow-hidden shadow-xl"
          >
            <div className="max-w-3xl mx-auto px-4 py-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-nude w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Pesquise por batom, base, delineador, rímel..."
                  className="w-full pl-12 pr-12 py-4 bg-brand-nude-light/20 border border-brand-nude-light/60 rounded-2xl text-brand-gold text-sm font-medium outline-none focus:border-brand-nude transition-all shadow-inner placeholder-brand-chocolate-light/50"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-brand-nude hover:text-brand-chocolate rounded-full hover:bg-brand-rose/50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN CONTENT AREA ── */}
      <main className="flex-1">

        {/* ── ELEGANT HERO SECTION ── */}
        <section className="relative overflow-hidden bg-gradient-to-b from-brand-rose/10 to-transparent py-16 md:py-24 border-b border-brand-nude-light/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Hero: Content Text Column */}
              <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-rose border border-brand-nude-light/60 text-brand-gold text-[11px] font-bold tracking-widest uppercase">
                  <Star className="w-3.5 h-3.5 fill-brand-gold text-brand-gold" />
                  <span>Maquiagem & Beleza Premium</span>
                </div>

                <h1 className="font-main text-5xl sm:text-6xl lg:text-7xl font-bold text-brand-rose leading-[1.05] tracking-tight">
                  Beleza real, sublime e ao seu
                </h1>

                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="inline-flex flex-col items-center justify-center px-7 py-3.5 mt-6 mb-2 rounded-full bg-brand-rose text-white shadow-[0_10px_30px_rgba(0,0,0,0.12)]"
                >
                  <small className="font-main text-[13px] font-semibold tracking-[0.12em] uppercase">
                    Ao seu alcance por
                  </small>
                  <strong className="font-main text-[34px] font-bold mt-1 leading-none">
                    R$10
                  </strong>
                </motion.div>

                <p className="text-base sm:text-lg text-brand-rose/85 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Uma curadoria feminina completa de maquiagens exclusivas, pincéis e mimos selecionados. Tudo na loja possui o valor fixo de R$10,00 para você brilhar sem preocupações.
                </p>

                {/* Single price stamp & Button */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 pt-4">
                  <button onClick={() => {
                      const el = document.getElementById('catalog');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="flex items-center gap-2 bg-brand-rose hover:bg-brand-gold text-brand-gold hover:text-brand-rose border border-brand-nude-light/60 px-8 py-4 rounded-full text-xs font-main font-semibold uppercase tracking-widest transition-all duration-300 shadow-xl hover:-translate-y-0.5 cursor-pointer"
                  >
                    Ver Nosso Catálogo <ArrowRight className="w-4 h-4" />
                  </button>

                  {/* Stamp */}
                  <div className="flex items-center gap-3 bg-brand-rose border border-brand-nude-light/60 px-5 py-3 rounded-2xl shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-brand-gold flex items-center justify-center text-brand-rose text-xs font-black">
                      R$10
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-brand-gold leading-none mb-0.5">Preço Único</p>
                      <p className="text-xs text-brand-chocolate-light/80">Sem taxas ou surpresas adicionais</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hero: Visual Asymmetry Column */}
              <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
                <div className="relative w-full max-w-[340px] aspect-[4/5] bg-brand-rose/30 rounded-[32px] p-4 border border-brand-nude-light/60 overflow-hidden shadow-lg">
                  {/* Background decoration circles */}
                  <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-brand-gold/10 blur-xl" />
                  <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-brand-chocolate/5 blur-xl" />
                  
                  {/* Main Premium Illustration */}
                  <div className="relative w-full h-full rounded-[24px] overflow-hidden bg-brand-cream flex flex-col items-center justify-center text-center border border-brand-nude-light/60">
                    <img 
                      src="https://i.ibb.co/5XHfXPDX/A-nossa-a-o-foi-um-sucesso-Eu-agrade-o-a-cada-cliente-que-fez-parte-desse-dia-memor-vel.jpg" 
                      alt="Cosméticos Premium"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-chocolate/80 via-transparent to-transparent" />
                    
                    <div className="mt-auto relative z-10 text-white space-y-3 p-6">
                      <span className="text-[9px] font-bold tracking-widest uppercase bg-brand-gold px-2.5 py-1 rounded-full inline-block text-white">
                        Coleção Exclusiva
                      </span>
                      <h4 className="font-main text-2xl font-bold text-white">
                        Realce a sua essência natural todos os dias
                      </h4>
                      <p className="text-[11px] text-white">
                        Produtos de altíssima cobertura, veganos e de fácil aplicação.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Floating Micro Badge */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
                  className="absolute -top-6 -left-6 bg-brand-rose p-4 rounded-2xl shadow-xl border border-brand-nude-light/60 flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-xl bg-brand-gold-pale flex items-center justify-center text-brand-gold">
                    <Heart className="w-5 h-5 fill-brand-gold text-brand-gold" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-brand-chocolate-light uppercase leading-none">Amor em Detalhes</p>
                    <p className="text-xs text-brand-chocolate font-bold mt-0.5">Curadoria Feminina</p>
                  </div>
                </motion.div>
              </div>

            </div>
          </div>
        </section>

        {/* ── INTERACTIVE CATEGORY FILTER BAR ── */}
        <section id="catalog" className="bg-brand-cream/60 backdrop-blur-md border-y border-brand-nude-light/60 sticky top-20 z-90">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center py-1 overflow-x-auto gap-2 pb-4">
              <div className="flex items-center gap-1.5 min-w-max">
                {categories.map((category: any) => (
                  <button key={category.name} onClick={() => setSelectedCategory(category.name)}
                    className={`flex items-center gap-2 px-4.5 py-2.5 rounded-full font-main font-medium uppercase tracking-[0.05em] text-[11px] transition-all whitespace-nowrap cursor-pointer border ${
                      selectedCategory === category.name
                        ? 'bg-brand-rose text-brand-gold border-brand-rose shadow-md scale-105'
                        : 'bg-brand-cream border-brand-rose/40 text-brand-rose hover:bg-brand-rose/10'
                    }`}
                  >
                    <span>{category.emoji}</span>
                    <span>{category.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── PRODUCTS GRID SECTION ── */}
        <section className="py-16 bg-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Catalog Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 mb-10 pb-4 border-b border-brand-rose/20">
              <div>
                <span className="text-xs font-bold tracking-widest text-brand-rose/70 uppercase block mb-1">
                  Explorar Catálogo
                </span>
                <h2 className="font-main text-3xl sm:text-4xl font-bold text-brand-rose">
                  Nossa <span className="italic font-normal">Coleção</span>
                </h2>
              </div>
              
              <div className="flex items-center gap-3 text-xs text-brand-rose/85">
                <span className="font-semibold bg-brand-rose px-3 py-1.5 rounded-xl border border-brand-nude-light/60 shadow-sm text-brand-gold">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'Produto Encontrado' : 'Produtos Encontrados'}
                </span>
                {selectedCategory !== 'Todos' && (
                  <button onClick={() => setSelectedCategory('Todos')}
                    className="flex items-center gap-1.5 text-brand-rose hover:text-brand-rose/80 font-main font-semibold transition-colors underline decoration-dashed"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Limpar Filtro
                  </button>
                )}
              </div>
            </div>

            {/* Product Cards Grid with AnimatePresence */}
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    categories={categories}
                    onAddToCart={handleAddToCart}
                    onViewDetails={(prod) => {
                      setSelectedProduct(prod);
                      setDetailsModalOpen(true);
                    }}
                  />
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Empty States Handling */}
            {filteredProducts.length === 0 && (
              <div className="py-24 text-center max-w-md mx-auto">
                <div className="w-16 h-16 rounded-full bg-brand-rose flex items-center justify-center text-brand-nude-dark mx-auto mb-4">
                  <Search className="w-6 h-6 stroke-1.5" />
                </div>
                <h3 className="font-main text-xl font-bold text-brand-chocolate mb-2">
                  Nenhum produto encontrado
                </h3>
                <p className="text-sm text-brand-chocolate-light/75 mb-6">
                  Não encontramos correspondência para a sua busca ou categoria. Tente redefinir os filtros ou buscar outra palavra-chave!
                </p>
                <button onClick={() => {
                    setSelectedCategory('Todos');
                    setSearchQuery('');
                  }}
                  className="px-6 py-3 bg-brand-chocolate hover:bg-brand-gold text-brand-cream hover:text-brand-chocolate text-xs font-main font-semibold uppercase tracking-wider rounded-xl transition-all shadow-md"
                >
                  Ver Todos os Produtos
                </button>
              </div>
            )}

          </div>
        </section>

        {/* ── CORE BRAND VALUE DIFFERENTIALS ── */}
        <section className="bg-brand-rose text-brand-chocolate-light py-16 border-t border-brand-nude-light/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-xl mx-auto mb-12">
              <span className="text-[10px] font-bold text-brand-gold uppercase tracking-widest block mb-2">Compromisso Makeup</span>
              <h3 className="font-main text-3xl font-bold text-brand-gold">Porque comprar conosco é incomparável</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              
              <div className="p-6 bg-brand-rose/60 border border-brand-nude-light/60 rounded-2xl flex flex-col items-center text-center hover:border-brand-gold/40 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-brand-gold/10 flex items-center justify-center text-brand-gold mb-4">
                  <Tag className="w-6 h-6" />
                </div>
                <h4 className="font-main text-lg font-bold text-brand-gold mb-2">Preço Único de R$10</h4>
                <p className="text-xs text-brand-chocolate-light/80 leading-relaxed">
                  Sem letras miúdas ou taxas ocultas. Escolha o que desejar sabendo exatamente quanto vai pagar.
                </p>
              </div>

              <div className="p-6 bg-brand-rose/60 border border-brand-nude-light/60 rounded-2xl flex flex-col items-center text-center hover:border-brand-gold/40 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-brand-gold/10 flex items-center justify-center text-brand-gold mb-4">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h4 className="font-main text-lg font-bold text-brand-gold mb-2">Qualidade Selecionada</h4>
                <p className="text-xs text-brand-chocolate-light/80 leading-relaxed">
                  Nossos produtos passam por testes rigorosos de pigmentação, durabilidade e cuidados com a pele.
                </p>
              </div>

              <div className="p-6 bg-brand-rose/60 border border-brand-nude-light/60 rounded-2xl flex flex-col items-center text-center hover:border-brand-gold/40 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-brand-gold/10 flex items-center justify-center text-brand-gold mb-4">
                  <Heart className="w-6 h-6" />
                </div>
                <h4 className="font-main text-lg font-bold text-brand-gold mb-2">Cruelty-Free 🐰</h4>
                <p className="text-xs text-brand-chocolate-light/80 leading-relaxed">
                  Toda a nossa curadoria é focada em cosméticos livres de testes ou crueldades em animais.
                </p>
              </div>

              <div className="p-6 bg-brand-rose/60 border border-brand-nude-light/60 rounded-2xl flex flex-col items-center text-center hover:border-brand-gold/40 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-brand-gold/10 flex items-center justify-center text-brand-gold mb-4">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h4 className="font-main text-lg font-bold text-brand-gold mb-2">Atendimento no WhatsApp</h4>
                <p className="text-xs text-brand-chocolate-light/80 leading-relaxed">
                  Finalize seu pedido com suporte humanizado e combine a melhor forma de pagamento e entrega rápida.
                </p>
              </div>

            </div>
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer className="bg-brand-rose border-t border-brand-nude-light/60 text-brand-chocolate-light/80 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center space-y-8">
          
          <a href="#" className="flex items-baseline gap-1">
            <span className="font-logo font-semibold tracking-[0.03em] text-4xl italic text-brand-gold">
              {settings.name}
            </span>
          </a>

          <p className="text-xs max-w-md text-brand-chocolate-light/75 leading-relaxed">
            {settings.slogan} • Maquiagens, acessórios e produtos femininos de beleza premium por preço único e justo de R$ 10,00.
          </p>

          <div className="flex items-center gap-4">
            <a
              href={settings.ig}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-brand-rose border border-brand-nude-light/60 hover:bg-brand-gold hover:text-brand-rose rounded-full text-brand-gold transition-all duration-300"
              title="Siga-nos no Instagram"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href={`https://wa.me/${settings.phone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-brand-rose border border-brand-nude-light/60 hover:bg-emerald-600 hover:text-white rounded-full text-brand-gold transition-all duration-300"
              title="Fale conosco no WhatsApp"
            >
              <MessageSquare className="w-5 h-5" />
            </a>
          </div>

          <div className="pt-8 border-t border-brand-nude-light/30 w-full text-center text-[11px] text-brand-chocolate-light/50 space-y-1">
            <p>© 2026 {settings.name} — Todos os direitos reservados.</p>
            <p>Criado com amor por curadoria feminina premium.</p>
          </div>

        </div>
      </footer>

      {/* ── FLOATING CART BUTTON ── */}
      <button onClick={() => setCartOpen(true)}
        className="fixed bottom-6 right-6 z-150 w-16 h-16 bg-brand-gold hover:bg-brand-chocolate text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer border-2 border-brand-cream"
        title="Ver carrinho"
      >
        <ShoppingBag className="w-7 h-7" />
        {cart.length > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
            {cart.reduce((sum, item) => sum + item.qty, 0)}
          </span>
        )}
      </button>

      {/* ── TOAST OVERLAY NOTIFICATION ── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 30, x: '-50%' }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-500 bg-brand-rose text-brand-nude-dark px-6 py-4 rounded-2xl shadow-[0_20px_50px_rgba(19,9,4,0.4)] border border-brand-gold/40 text-xs font-semibold tracking-wide whitespace-nowrap"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PRODUCT DETAILS MODAL ── */}
      <ProductDetailsModal
        product={selectedProduct}
        categories={categories}
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedProduct(null);
        }}
        onAddToCart={handleAddToCart}
      />

      {/* ── SHOPPING CART DRAWER ── */}
      <CartSidebar
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        categories={categories}
        onChangeQty={handleChangeQty}
        onRemove={handleRemoveFromCart}
        storePhone={settings.phone}
        storeName={settings.name}
        onProceedToCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />

      {/* ── CHECKOUT MODAL ── */}
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        cart={cart}
        total={cart.reduce((sum, item) => sum + item.qty * 10, 0)}
        onSuccess={(orderData) => {
          saveOrder(orderData);
          setCart([]);
          setCheckoutOpen(false);
          triggerToast('🎉 Pedido realizado com sucesso!');
        }}
      />

      {/* ── FULL FEATURED ADMIN DASHBOARD ── */}
      <AdminPanel
        isOpen={adminOpen}
        initialTab={adminInitialTab}
        onClose={() => setAdminOpen(false)}
        products={products}
        orders={orders}
        settings={settings}
        categories={categories}
        isAdmin={isAdmin}
        login={login}
        logout={logout}
        user={user}
        onAddProduct={handleAddProduct}
        onUpdateProduct={handleUpdateProduct}
        onDeleteProduct={handleDeleteProduct}
        onSaveSettings={handleSaveSettings}
        onAddCategory={addCategory}
        onUpdateCategory={updateCategory}
        onDeleteCategory={deleteCategory}
        onUpdateOrderStatus={updateOrderStatus}
      />

    </div>
  );
}
