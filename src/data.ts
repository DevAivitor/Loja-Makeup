import { Product } from './types';

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Batom Velvet Matte Rose',
    cat: 'Batom',
    desc: 'Acabamento matte aveludado de altíssima fixação e textura hidratante ultra leve que não resseca os lábios.',
    price: 10,
    img: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&q=80&w=600',
    badge: 'hot'
  },
  {
    id: 2,
    name: 'Batom Vermelho Absoluto',
    cat: 'Batom',
    desc: 'Pigmento puro e intenso com textura ultra macia. Proporciona lábios marcantes com apenas uma aplicação.',
    price: 10,
    img: 'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?auto=format&fit=crop&q=80&w=600',
    badge: 'new'
  },
  {
    id: 3,
    name: 'Base Líquida Acabamento Natural',
    cat: 'Base',
    desc: 'Fórmula leve e fluida de cobertura média construível. Uniformiza o tom da pele deixando um viço natural.',
    price: 10,
    img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=600',
    badge: 'hot'
  },
  {
    id: 4,
    name: 'Paleta de Sombras Golden Rose',
    cat: 'Sombra',
    desc: '9 tons neutros, rosados e metálicos de alta pigmentação para criar looks elegantes e atemporais.',
    price: 10,
    img: 'https://images.unsplash.com/photo-1522337360788-8b13edd793be?auto=format&fit=crop&q=80&w=600',
    badge: 'new'
  },
  {
    id: 5,
    name: 'Blush Compacto Pêssego Radiante',
    cat: 'Blush',
    desc: 'Textura ultrafina com leve cintilância dourada. Proporciona um ar saudável e radiante natural às bochechas.',
    price: 10,
    img: 'https://images.unsplash.com/photo-1631730359575-38e4755d772b?auto=format&fit=crop&q=80&w=600',
    badge: ''
  },
  {
    id: 6,
    name: 'Delineador Caneta Carbon Black',
    cat: 'Delineador',
    desc: 'Ponta de precisão extrema de feltro flexível. Traço firme, secagem ultrarrápida e resistente a borrões.',
    price: 10,
    img: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=600',
    badge: 'last'
  },
  {
    id: 7,
    name: 'Máscara de Cílios Alongamento Infinito',
    cat: 'Rímel',
    desc: 'Fórmula enriquecida com queratina e aplicador curvado que alcança desde a raiz até as pontas com efeito leque.',
    price: 10,
    img: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=600',
    badge: 'hot'
  },
  {
    id: 8,
    name: 'Primer Facial Matte Blur',
    cat: 'Primer',
    desc: 'Suaviza poros visíveis e linhas finas instantaneamente, controlando o brilho para uma maquiagem duradoura.',
    price: 10,
    img: 'https://images.unsplash.com/photo-1608248597481-496100c80836?auto=format&fit=crop&q=80&w=600',
    badge: ''
  },
  {
    id: 9,
    name: 'Brilho Labial Crystal Glow',
    cat: 'Batom',
    desc: 'Luminosidade efeito espelhado sem sensação pegajosa, enriquecido com óleo de jojoba para lábios macios.',
    price: 10,
    img: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&q=80&w=600',
    badge: 'new'
  },
  {
    id: 10,
    name: 'Kit de Esponjas Velvet Blend',
    cat: 'Esponja & Pincel',
    desc: 'Duas esponjas macias com recortes anatômicos para aplicação uniforme de corretivos e base sem desperdício.',
    price: 10,
    img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=600',
    badge: ''
  }
];

export const CATEGORIES = [
  { name: 'Todos', label: 'Todos os Produtos', emoji: '✨' },
  { name: 'Batom', label: 'Batons & Gloss', emoji: '💄' },
  { name: 'Base', label: 'Bases & Corretivos', emoji: '🎨' },
  { name: 'Sombra', label: 'Paletas de Sombra', emoji: '👁️' },
  { name: 'Blush', label: 'Blushes', emoji: '🌸' },
  { name: 'Delineador', label: 'Delineadores', emoji: '✏️' },
  { name: 'Rímel', label: 'Máscara de Cílios', emoji: '✨' },
  { name: 'Primer', label: 'Primers', emoji: '🧴' },
  { name: 'Hidratante', label: 'Hidratantes', emoji: '💧' },
  { name: 'Esponja & Pincel', label: 'Pincéis & Esponjas', emoji: '🖌️' }
];

export const CATEGORY_ICONS: Record<string, string> = {
  'Batom': '💄',
  'Base': '🎨',
  'Sombra': '👁️',
  'Blush': '🌸',
  'Delineador': '✏️',
  'Rímel': '✨',
  'Primer': '🧴',
  'Hidratante': '💧',
  'Esponja & Pincel': '🖌️'
};
