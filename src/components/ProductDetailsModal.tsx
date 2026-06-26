import React from 'react';
import { Product } from '../types';
import { CATEGORY_ICONS } from '../data';
import { X, ShoppingBag, CheckCircle, Shield, Truck, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProductDetailsModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (id: number) => void;
  categories: any[];
}

export default function ProductDetailsModal({ product, isOpen, onClose, onAddToCart, categories }: ProductDetailsModalProps) {
  if (!product) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-brand-rose/80 backdrop-blur-md"
          />

          {/* Modal Content Wrapper */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative bg-brand-rose rounded-3xl overflow-hidden shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col md:flex-row z-10 border border-brand-nude-light/60"
          >
            {/* Close Button */}
            <button onClick={onClose} className="font-main font-semibold absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-brand-rose/90 border border-brand-nude-light hover:border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-rose flex items-center justify-center shadow-md hover:rotate-90 transition-all duration-300 cursor-pointer" aria-label="Fechar detalhes" >
              <X className="w-5 h-5" />
            </button>

            {/* Left Column: Image */}
            <div className="w-full md:w-1/2 bg-brand-rose/20 relative aspect-square md:aspect-auto md:h-inherit flex items-center justify-center">
              {product.img ? (
                <img
                  src={product.img}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full min-h-[250px] flex flex-col items-center justify-center gap-3 text-brand-nude">
                  <span className="text-7xl filter grayscale opacity-80">
                    {categories.find(c => c.name === product.cat)?.emoji || '💄'}
                  </span>
                  <span className="text-sm font-semibold uppercase tracking-widest opacity-60">
                    {product.cat}
                  </span>
                </div>
              )}
              {product.badge && (
                <div className="absolute top-4 left-4">
                  {product.badge === 'new' && (
                    <span className="px-3 py-1 bg-brand-gold text-brand-rose text-xs font-black tracking-wider uppercase rounded-full shadow-lg">
                      Novidade
                    </span>
                  )}
                  {product.badge === 'hot' && (
                    <span className="px-3 py-1 bg-brand-rose border border-brand-nude-light text-brand-gold text-xs font-black tracking-wider uppercase rounded-full shadow-lg">
                      Destaque
                    </span>
                  )}
                  {product.badge === 'last' && (
                    <span className="px-3 py-1 bg-red-950/90 border border-red-700/50 text-red-200 text-xs font-bold tracking-wider uppercase rounded-full shadow-lg">
                      Esgotando
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Information */}
            <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col justify-between overflow-y-auto max-h-[50vh] md:max-h-inherit">
              <div>
                <span className="text-xs font-bold tracking-widest text-brand-nude-dark uppercase mb-2 block">
                  {product.cat}
                </span>
                
                <h2 className="font-main text-3xl font-medium text-brand-gold leading-tight mb-4">
                  {product.name}
                </h2>

                <div className="flex items-baseline gap-2 mb-6">
                  <span className="font-main text-3xl font-bold text-brand-gold">
                    R$ 10,00
                  </span>
                  <span className="text-xs text-brand-nude-dark font-medium px-2 py-0.5 rounded bg-brand-gold-pale">
                    Preço Único de Loja
                  </span>
                </div>

                <p className="text-sm text-brand-chocolate-light/85 leading-relaxed mb-6">
                  {product.desc}
                </p>

                {/* Benefits / Guarantees */}
                <div className="space-y-3.5 mb-8">
                  <div className="flex items-center gap-3 text-xs text-brand-chocolate-light/95">
                    <CheckCircle className="w-4 h-4 text-brand-gold shrink-0" />
                    <span>Fórmula premium e dermatologicamente testada</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-brand-chocolate-light/95">
                    <Shield className="w-4 h-4 text-brand-gold shrink-0" />
                    <span>Livre de crueldade animal (Cruelty-free) 🐰</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-brand-chocolate-light/95">
                    <Truck className="w-4 h-4 text-brand-gold shrink-0" />
                    <span>Separação imediata para entrega via WhatsApp</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-brand-chocolate-light/95">
                    <Sparkles className="w-4 h-4 text-brand-gold shrink-0" />
                    <span>Curadoria exclusiva com qualidade premium garantida</span>
                  </div>
                </div>
              </div>

              {/* Add to Cart Actions */}
              <div className="pt-6 border-t border-brand-nude-light/40 flex flex-col sm:flex-row gap-3">
                <button type="button" onClick={() => {
                    onAddToCart(product.id);
                    onClose();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-brand-gold hover:bg-brand-gold-light text-brand-rose py-4 rounded-xl text-xs font-bold uppercase tracking-widest font-semibold transition-all duration-300 shadow-lg hover:scale-[1.01] active:scale-98 cursor-pointer"
                >
                  <ShoppingBag className="w-4.5 h-4.5" /> Adicionar ao Carrinho
                </button>
                <button type="button" onClick={onClose} className="font-main font-semibold border border-brand-nude-light hover:border-brand-gold text-brand-gold hover:bg-brand-gold/10 py-4 px-6 rounded-xl text-xs uppercase tracking-widest transition-all duration-300 cursor-pointer" >
                  Voltar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
