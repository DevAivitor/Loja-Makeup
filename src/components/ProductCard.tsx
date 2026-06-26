import React from 'react';
import { Product } from '../types';
import { CATEGORY_ICONS } from '../data';
import { Plus, Eye, Sparkles, Flame, AlarmClock } from 'lucide-react';
import { motion } from 'motion/react';

interface ProductCardProps {
  product: Product;
  onAddToCart: (id: number) => void;
  onViewDetails: (product: Product) => void;
  categories: any[];
  key?: React.Key | number;
}

export default function ProductCard({ product, onAddToCart, onViewDetails, categories }: ProductCardProps) {
  const getBadgeElement = (badge: string) => {
    switch (badge) {
      case 'new':
        return (
          <span className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 bg-brand-gold text-brand-rose text-[10px] font-black tracking-wider uppercase rounded-full shadow-md backdrop-blur-sm">
            <Sparkles className="w-3 h-3" /> Novidade
          </span>
        );
      case 'hot':
        return (
          <span className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 bg-brand-rose border border-brand-nude-light text-brand-gold text-[10px] font-black tracking-wider uppercase rounded-full shadow-md">
            <Flame className="w-3 h-3 text-brand-gold" /> Mais Vendido
          </span>
        );
      case 'last':
        return (
          <span className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 bg-red-950/90 border border-red-700/50 text-red-200 text-[10px] font-bold tracking-wider uppercase rounded-full shadow-md">
            <AlarmClock className="w-3 h-3 text-red-400" /> Poucas Unidades
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="group relative flex flex-col bg-brand-rose rounded-2xl overflow-hidden border border-brand-nude-light/60 hover:border-brand-nude/40 shadow-sm hover:shadow-xl transition-all duration-300"
    >
      {/* Product Image Wrapper */}
      <div 
        onClick={() => onViewDetails(product)}
        className="relative aspect-square w-full bg-brand-cream/30 overflow-hidden cursor-pointer"
      >
        {product.img ? (
          <img
            src={product.img}
            alt={product.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-brand-nude">
            <span className="text-5xl filter grayscale opacity-80 group-hover:scale-110 transition-transform duration-500">
              {categories.find(c => c.name === product.cat)?.emoji || '💄'}
            </span>
            <span className="text-[11px] uppercase tracking-widest font-semibold opacity-50">
              {product.cat}
            </span>
          </div>
        )}

        {/* Hover overlay for quick view */}
        <div className="absolute inset-0 bg-brand-rose/60 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <button type="button" className="font-main font-semibold flex items-center gap-2 bg-brand-gold text-brand-rose px-5 py-2.5 rounded-full text-xs tracking-wider uppercase shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:bg-brand-gold-light hover:scale-105" >
            <Eye className="w-4 h-4" /> Detalhes
          </button>
        </div>

        {getBadgeElement(product.badge)}
      </div>

      {/* Product Information */}
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold tracking-widest text-brand-nude-dark uppercase">
            {product.cat}
          </span>
          <span className="text-xs font-semibold bg-brand-gold-pale text-brand-nude-dark px-2.5 py-0.5 rounded-full">
            Tudo R$10
          </span>
        </div>

        <h3 
          onClick={() => onViewDetails(product)}
          className="font-main text-lg text-brand-gold font-medium leading-snug tracking-wide group-hover:text-brand-gold-light transition-colors duration-200 mb-2 cursor-pointer line-clamp-1"
        >
          {product.name}
        </h3>

        <p className="text-xs text-brand-chocolate-light/85 line-clamp-2 mb-4 leading-relaxed flex-1">
          {product.desc}
        </p>

        {/* Product Card Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-brand-nude-light/40 mt-auto">
          <div className="flex flex-col">
            <span className="text-[10px] text-brand-chocolate-light/70 uppercase tracking-wider font-bold">
              Preço Fixo
            </span>
            <span className="font-main text-2xl font-bold text-brand-gold">
              R$ 10,00
            </span>
          </div>

          <button type="button" onClick={() => onAddToCart(product.id)}
            id={`btn-add-${product.id}`}
            aria-label={`Adicionar ${product.name} ao carrinho`}
            className="flex items-center justify-center w-11 h-11 rounded-full bg-brand-gold hover:bg-brand-gold-light text-brand-rose shadow-md hover:shadow-lg transition-all duration-300 hover:rotate-90 active:scale-95 cursor-pointer font-bold"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
