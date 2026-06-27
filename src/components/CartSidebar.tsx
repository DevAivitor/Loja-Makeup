import React from 'react';
import { CATEGORY_ICONS } from '../data';
import { X, Trash2, Plus, Minus, ShoppingBag, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CartItem {
  id: number;
  name: string;
  cat: string;
  desc: string;
  price: number;
  img: string;
  badge: string;
  qty: number;
}

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onChangeQty: (id: number, delta: number) => void;
  onRemove: (id: number) => void;
  storePhone: string;
  storeName: string;
  onProceedToCheckout: () => void;
  categories: any[];
}

export default function CartSidebar({
  isOpen,
  onClose,
  cart,
  onChangeQty,
  onRemove,
  storePhone,
  storeName,
  onProceedToCheckout,
  categories
}: CartSidebarProps) {
  const total = cart.reduce((sum, item) => sum + item.qty * 10, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  const handleCheckoutClick = () => {
    if (cart.length === 0) return;
    onProceedToCheckout();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-200 overflow-hidden">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-chocolate/40 backdrop-blur-sm cursor-pointer"
          />

          {/* Drawer container */}
          <div className="absolute inset-y-0 right-0 max-w-full flex">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="cart-drawer w-screen max-w-md bg-brand-rose flex flex-col shadow-2xl border-l border-brand-nude-light/60"
            >
              {/* Cart Drawer Header */}
              <div className="p-6 border-b border-brand-nude-light/60 flex items-center justify-between bg-brand-rose">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-brand-gold" />
                  <h2 className="font-main text-2xl font-bold text-brand-gold">
                    Meu Carrinho
                  </h2>
                  <span className="text-[11px] font-black bg-brand-gold text-brand-rose px-2.5 py-0.5 rounded-full ml-1">
                    {totalItems}
                  </span>
                </div>
                <button onClick={onClose} className="font-main font-semibold w-9 h-9 rounded-full bg-brand-rose hover:bg-brand-gold text-brand-gold hover:text-brand-rose border border-brand-nude-light hover:border-brand-gold flex items-center justify-center transition-all cursor-pointer" aria-label="Fechar carrinho" >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cart Drawer Items List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-brand-gold">
                    <ShoppingBag className="w-16 h-16 stroke-1 mb-4 opacity-50" />
                    <p className="font-main text-xl font-bold text-brand-gold mb-1">
                      Seu carrinho está vazio
                    </p>
                    <p className="text-xs max-w-xs text-brand-chocolate-light/80">
                      Explore o catálogo e adicione produtos selecionados com muito carinho!
                    </p>
                  </div>
                ) : (
                  cart.map(item => (
                    <motion.div
                      layout
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex gap-4 p-4 rounded-xl border border-brand-nude-light bg-brand-rose/40 hover:bg-brand-rose/70 hover:border-brand-gold/30 transition-all duration-200"
                    >
                      {/* Item Thumbnail */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-brand-rose/30 flex-shrink-0 flex items-center justify-center relative">
                        {item.img ? (
                          <img
                            src={item.img}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl filter grayscale opacity-80">
                            {categories.find(c => c.name === item.cat)?.emoji || '💄'}
                          </span>
                        )}
                      </div>

                      {/* Item Information and controls */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between gap-1">
                            <h4 className="font-main text-base text-brand-gold font-medium leading-tight truncate">
                              {item.name}
                            </h4>
                            <button onClick={() => onRemove(item.id)}
                              className="text-brand-gold hover:text-red-400 transition-colors p-1 cursor-pointer"
                              title="Remover produto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-chocolate-light/70 block mt-0.5">
                            {item.cat}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-brand-nude-light/40">
                          {/* Quantity selector */}
                          <div className="flex items-center gap-1 bg-brand-rose border border-brand-nude-light rounded-lg px-1.5 py-0.5 shadow-sm">
                            <button onClick={() => onChangeQty(item.id, -1)}
                              className="w-5 h-5 flex items-center justify-center hover:bg-brand-gold/10 hover:text-brand-gold rounded-md text-brand-gold/70 transition-colors text-xs cursor-pointer"
                              disabled={item.qty <= 1}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold text-brand-gold min-w-6 text-center">
                              {item.qty}
                            </span>
                            <button onClick={() => onChangeQty(item.id, 1)}
                              className="w-5 h-5 flex items-center justify-center hover:bg-brand-gold/10 hover:text-brand-gold rounded-md text-brand-gold transition-colors text-xs cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <span className="font-main text-base font-bold text-brand-gold">
                            R$ {(item.qty * 10).toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Cart Drawer Footer */}
              {cart.length > 0 && (
                <div className="p-6 border-t border-brand-nude-light/60 bg-brand-rose/60 space-y-4">
                  <div className="cart-summary flex justify-between items-baseline">
                    <span className="text-xs text-brand-chocolate-light/80 font-bold tracking-wider uppercase">
                      Subtotal
                    </span>
                    <div className="flex flex-col items-end">
                      <span className="font-main text-3xl font-bold text-brand-gold">
                        R$ {total.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-[10px] text-brand-chocolate-light/65 tracking-wide mt-0.5">
                        Todos os produtos por R$10,00 cada
                      </span>
                    </div>
                  </div>

                  <button onClick={handleCheckoutClick} className="checkout-btn font-main font-semibold w-full py-4 bg-brand-gold hover:bg-brand-chocolate text-white rounded-xl text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2.5 shadow-lg shadow-brand-gold/10 hover:shadow-brand-gold/20 hover:-translate-y-0.5 cursor-pointer" >
                    <ShoppingBag className="w-4 h-4" /> Finalizar Compra
                  </button>

                  <p className="text-[10px] text-center text-brand-chocolate-light/60">
                    Você será direcionado para a tela de pagamento seguro.
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
