import React, { useState, useEffect } from 'react';
import { X, Check, MapPin, Store, ArrowRight, CheckCircle2, Truck, User, Package, CreditCard, Loader2, Bike } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CartItem {
  id: number;
  name: string;
  cat: string;
  desc: string;
  price: number;
  qty: number;
  img?: string;
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  total: number;
  onSuccess: (orderData: { items: string[]; total: number; status: string; customer: any; deliveryMethod: string; deliveryType?: string; address?: any; shippingDetails?: any; paymentMethod?: string; deliveryAddress?: any; }) => Promise<void> | void;
}

type CheckoutStep = 'customer' | 'method' | 'address' | 'shipping' | 'payment' | 'success';

const maskPhone = (v: string) => {
  v = v.replace(/\D/g, "");
  if (v.length > 11) v = v.slice(0, 11);
  if (v.length > 2) v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
  if (v.length > 7) v = v.replace(/(\d{5})(\d)/, "$1-$2");
  return v;
};

const maskCPF = (v: string) => {
  v = v.replace(/\D/g, "");
  if (v.length > 11) v = v.slice(0, 11);
  if (v.length > 3) v = v.replace(/^(\d{3})(\d)/, "$1.$2");
  if (v.length > 6) v = v.replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3");
  if (v.length > 9) v = v.replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
  return v;
};

const maskCEP = (v: string) => {
  v = v.replace(/\D/g, "");
  if (v.length > 8) v = v.slice(0, 8);
  if (v.length > 5) v = v.replace(/^(\d{5})(\d)/, "$1-$2");
  return v;
};

const InputField = ({ label, type = "text", value, onChange, placeholder, required = false }: any) => (
  <div className="flex flex-col gap-2">
    <label className="text-[11px] font-bold text-[#E6D8C9] uppercase tracking-wider pl-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="w-full px-5 py-4 rounded-[16px] border border-transparent bg-white focus:border-[#D4A017] focus:ring-4 focus:ring-[#D4A017]/20 outline-none transition-all text-[#2C1B12] placeholder-gray-400 shadow-sm"
    />
  </div>
);

export default function CheckoutModal({ isOpen, onClose, cart, total, onSuccess }: CheckoutModalProps) {
  const [step, setStep] = useState<CheckoutStep>('customer');
  const [isProcessing, setIsProcessing] = useState(false);

  // Customer Data
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Delivery Data
  const [deliveryMethod, setDeliveryMethod] = useState<'store' | 'delivery'>('store');
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [reference, setReference] = useState('');
  
  const [isFetchingCep, setIsFetchingCep] = useState(false);

  // Shipping details
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<any>(null);
  const [calculatingShipping, setCalculatingShipping] = useState(false);

  const calculateOrderTotal = () => {
    return total + (shippingCost || 0);
  };
  const finalTotal = calculateOrderTotal();

  useEffect(() => {
    if (isOpen) {
      setStep('customer');
      setIsProcessing(false);
      setShippingCost(0);
      setSelectedShipping(null);
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [isOpen]);

  const handleCepLookup = async (cepVal: string) => {
    const cleanCep = cepVal.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      setIsFetchingCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setStreet(data.logradouro || '');
          setNeighborhood(data.bairro || '');
          setCity(data.localidade || '');
          setState(data.uf || '');
        }
      } catch (e) {
      } finally {
        setIsFetchingCep(false);
      }
    }
  };

  const loadShippingOptions = async () => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length < 8) return;
    setCalculatingShipping(true);
    setShippingOptions([]);
    try {
      const options = [];
      
      // Motoboy Rule
      if (cleanCep.startsWith('78785')) {
        options.push({
          id: 'motoboy',
          company: { name: 'Entrega via Motoboy' },
          delivery_time: '1',
          price: 5.00,
          description: 'Entrega rápida (mesmo dia ou próximo dia útil)',
          icon: <Bike className="w-6 h-6" />
        });
      } else {
        const response = await fetch('/api/shipping/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fromPostalCode: '78785000',
            toPostalCode: cleanCep,
            products: cart.map(item => ({
              id: item.id,
              weight: 0.5,
              width: 10,
              height: 10,
              length: 10,
              price: item.price,
              qty: item.qty
            }))
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            const valid = data.filter(d => d.delivery_time && d.price && !d.company?.name?.toLowerCase().includes('correios'));
            options.push(...valid.map(o => ({...o, icon: <Truck className="w-6 h-6" />})));
          }
        }
      }
      
      setShippingOptions(options);
      if (options.length > 0) {
          setSelectedShipping(options[0]);
          setShippingCost(Number(options[0].price));
      } else {
          setShippingCost(0);
          setSelectedShipping(null);
      }
    } catch (error) {
      console.error('Error calculating shipping:', error);
    } finally {
      setCalculatingShipping(false);
    }
  };

  const handleCheckout = async () => {
    setIsProcessing(true);
    try {
      let deliveryInfo = null;
      if (deliveryMethod !== 'store') {
          const isMotoboy = selectedShipping?.id === 'motoboy';
          deliveryInfo = {
              type: isMotoboy ? 'motoboy' : 'correios',
              address: street,
              number: number,
              neighborhood: neighborhood,
              city: city,
              state: state,
              zip: cep,
              ...(!isMotoboy ? { shippingValue: Number(selectedShipping?.price || shippingCost) } : {})
          };
      }

      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { name, phone, email },
          delivery: deliveryInfo,
          items: cart.map(c => ({ name: c.name, quantity: c.qty }))
        })
      });
      
      const data = await response.json();
      if (data.checkout_url) {
        // Save order to Firestore first
        const orderData = {
          items: cart.map(c => `${c.qty}x ${c.name}`),
          total: total + (deliveryMethod !== 'store' ? Number(selectedShipping?.price || shippingCost) : 0),
          status: 'Aguardando Pagamento',
          customer: { name, phone, cpf, email },
          deliveryMethod,
          ...(deliveryMethod !== 'store' && {
            deliveryAddress: { street, number, complement, neighborhood, city, state, cep }
          })
        };
        await onSuccess(orderData);
        
        window.location.href = data.checkout_url;
      } else {
        alert('Ocorreu um erro ao gerar o pagamento. Tente novamente.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Ocorreu um erro ao gerar o pagamento. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  const steps = [
    { id: 'customer', title: 'Dados' },
    { id: 'method', title: 'Entrega' },
    { id: 'address', title: 'Endereço' },
    { id: 'shipping', title: 'Frete' },
    { id: 'payment', title: 'Pagamento' }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === step) >= 0 ? steps.findIndex(s => s.id === step) : 5;

  return (
    <div className="checkout-modal bg-black/60 backdrop-blur-sm p-0 sm:p-4 md:p-6 justify-center items-center" onWheel={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()}>
      <motion.div
        initial={{ scale: 0.98, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.98, opacity: 0, y: 10 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative w-full max-w-6xl h-[100dvh] sm:h-[90vh] bg-[#2C1B12] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden mx-auto my-auto"
      >
        {/* Elegant Header */}
        <div className="flex items-center justify-between p-6 bg-[#3A261A] shadow-md z-20">
          <h2 className="font-main text-2xl font-bold text-white flex items-center gap-3">
            <span className="w-1.5 h-6 rounded-full bg-[#D4A017] inline-block"></span>
            Finalizar Compra
          </h2>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors border border-white/10" >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden flex-col lg:flex-row min-h-0">
          
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col h-full overflow-hidden relative min-h-0">
            
            {/* Modern Stepper */}
            <div className="hidden sm:block px-10 py-8 border-b border-white/5 shrink-0">
              <div className="flex items-center justify-between relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-white/10" />
                {steps.map((s, i) => {
                  const isActive = step === s.id;
                  const isPast = currentStepIndex > i;
                  
                  // Hide address/shipping if store delivery
                  if ((s.id === 'address' || s.id === 'shipping') && deliveryMethod === 'store' && currentStepIndex > 1) {
                    return null;
                  }

                  return (
                    <div key={s.id} className="relative z-10 flex flex-col items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-4 ${isActive ? 'border-[#D4A017] bg-[#2C1B12] scale-125' : isPast ? 'border-emerald-500 bg-emerald-500' : 'border-white/20 bg-[#2C1B12]'} transition-all duration-300`} />
                      <span className={`absolute top-6 font-main text-xs uppercase tracking-wider font-bold whitespace-nowrap ${isActive ? 'text-[#D4A017]' : isPast ? 'text-emerald-500' : 'text-white/30'}`}>
                        {s.title}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="h-6" /> {/* Spacer for absolute text */}
            </div>

            {/* Mobile Stepper */}
            <div className="sm:hidden px-6 py-4 border-b border-white/5 bg-[#3A261A]/50">
               <div className="flex items-center gap-2 text-[#D4A017] font-bold font-main uppercase tracking-widest text-xs">
                  <span>Etapa {Math.min(currentStepIndex + 1, 5)} de 5 • {steps[Math.min(currentStepIndex, 4)]?.title}</span>
               </div>
            </div>

            <div className="checkout-content p-6 sm:p-10 custom-scrollbar min-h-0">
              <AnimatePresence mode="wait">
                
                {step === 'customer' && (
                  <motion.div key="customer" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="max-w-2xl mx-auto space-y-8">
                    <div className="mb-10">
                      <h3 className="font-main text-3xl font-bold text-white mb-2">Seus Dados</h3>
                      <p className="text-[#E6D8C9]">Preencha as informações para identificarmos você e seu pedido.</p>
                    </div>
                    
                    <div className="bg-[#3A261A] p-8 rounded-2xl shadow-lg border border-white/5 space-y-6">
                      <InputField label="Nome Completo" placeholder="Como deseja ser chamado?" value={name} onChange={(e:any) => setName(e.target.value)} />
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <InputField label="CPF" placeholder="000.000.000-00" value={cpf} onChange={(e:any) => setCpf(maskCPF(e.target.value))} />
                        <InputField label="WhatsApp" placeholder="(00) 00000-0000" type="tel" value={phone} onChange={(e:any) => setPhone(maskPhone(e.target.value))} />
                      </div>
                      
                      <InputField label="E-mail" type="email" placeholder="seu@email.com" value={email} onChange={(e:any) => setEmail(e.target.value)} />
                    </div>
                  </motion.div>
                )}

                {step === 'method' && (
                  <motion.div key="method" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="max-w-2xl mx-auto space-y-8">
                    <div className="mb-10">
                      <h3 className="font-main text-3xl font-bold text-white mb-2">Método de Entrega</h3>
                      <p className="text-[#E6D8C9]">Como você prefere receber seus produtos premium?</p>
                    </div>

                    <div className="grid grid-cols-1 gap-5">
                      <button onClick={() => setDeliveryMethod('store')}
                        className={`relative p-8 rounded-2xl border-2 text-left transition-all overflow-hidden bg-[#3A261A] ${deliveryMethod === 'store' ? 'border-[#D4A017] shadow-[0_0_20px_rgba(212,160,23,0.15)]' : 'border-white/5 hover:border-white/20'}`}
                      >
                        {deliveryMethod === 'store' && <div className="absolute top-6 right-6 text-[#D4A017]"><CheckCircle2 className="w-7 h-7" /></div>}
                        <div className="flex items-center gap-5 mb-4">
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center ${deliveryMethod === 'store' ? 'bg-[#D4A017] text-white' : 'bg-white/5 text-[#E6D8C9]'}`}>
                            <Store className="w-7 h-7" />
                          </div>
                          <div>
                            <h4 className="font-main text-xl font-bold text-white">Retirar na Loja</h4>
                            <span className="text-emerald-400 font-bold text-sm">Gratuito</span>
                          </div>
                        </div>
                        <p className="text-[#E6D8C9] leading-relaxed pl-[76px]">
                          Venha nos visitar e retire seu pedido presencialmente após a confirmação.
                        </p>
                      </button>

                      <button onClick={() => setDeliveryMethod('delivery')}
                        className={`relative p-8 rounded-2xl border-2 text-left transition-all overflow-hidden bg-[#3A261A] ${deliveryMethod === 'delivery' ? 'border-[#D4A017] shadow-[0_0_20px_rgba(212,160,23,0.15)]' : 'border-white/5 hover:border-white/20'}`}
                      >
                        {deliveryMethod === 'delivery' && <div className="absolute top-6 right-6 text-[#D4A017]"><CheckCircle2 className="w-7 h-7" /></div>}
                        <div className="flex items-center gap-5 mb-4">
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center ${deliveryMethod === 'delivery' ? 'bg-[#D4A017] text-white' : 'bg-white/5 text-[#E6D8C9]'}`}>
                            <Truck className="w-7 h-7" />
                          </div>
                          <div>
                            <h4 className="font-main text-xl font-bold text-white">Receber em Casa</h4>
                            <span className="text-[#E6D8C9] text-sm">Motoboy ou Transportadora</span>
                          </div>
                        </div>
                        <p className="text-[#E6D8C9] leading-relaxed pl-[76px]">
                          Entregamos com todo cuidado no seu endereço. Calcularemos o frete a seguir.
                        </p>
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 'address' && (
                  <motion.div key="address" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="max-w-2xl mx-auto space-y-8">
                    <div className="mb-10">
                      <h3 className="font-main text-3xl font-bold text-white mb-2">Endereço de Entrega</h3>
                      <p className="text-[#E6D8C9]">Onde devemos enviar seus produtos?</p>
                    </div>

                    <div className="bg-[#3A261A] p-8 rounded-2xl shadow-lg border border-white/5 space-y-6">
                      <div className="relative">
                         <InputField label="CEP" placeholder="00000-000" value={cep} onChange={(e:any) => {
                           const val = maskCEP(e.target.value);
                           setCep(val);
                           if (val.length === 9) handleCepLookup(val);
                         }} />
                         {isFetchingCep && <Loader2 className="w-6 h-6 animate-spin text-[#D4A017] absolute right-4 top-9" />}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                        <div className="sm:col-span-3">
                          <InputField label="Rua" placeholder="Av., Rua, Travessa..." value={street} onChange={(e:any) => setStreet(e.target.value)} />
                        </div>
                        <div className="sm:col-span-1">
                          <InputField label="Número" placeholder="Nº" value={number} onChange={(e:any) => setNumber(e.target.value)} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <InputField label="Complemento (Opcional)" placeholder="Apto, Bloco..." value={complement} onChange={(e:any) => setComplement(e.target.value)} />
                        <InputField label="Bairro" placeholder="Seu bairro" value={neighborhood} onChange={(e:any) => setNeighborhood(e.target.value)} />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="sm:col-span-2">
                           <InputField label="Cidade" placeholder="Sua cidade" value={city} onChange={(e:any) => setCity(e.target.value)} />
                        </div>
                        <div className="sm:col-span-1">
                           <InputField label="Estado" placeholder="UF" value={state} onChange={(e:any) => setState(e.target.value)} />
                        </div>
                      </div>
                      
                      <InputField label="Referência (Opcional)" placeholder="Próximo a..." value={reference} onChange={(e:any) => setReference(e.target.value)} />
                    </div>
                  </motion.div>
                )}

                {step === 'shipping' && (
                  <motion.div key="shipping" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="max-w-2xl mx-auto space-y-8">
                    <div className="mb-10">
                      <h3 className="font-main text-3xl font-bold text-white mb-2">Opções de Frete</h3>
                      <p className="text-[#E6D8C9]">Escolha a melhor modalidade para sua entrega.</p>
                    </div>

                    {calculatingShipping ? (
                      <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-12 h-12 animate-spin text-[#D4A017] mb-6" />
                        <p className="font-main font-bold text-white text-lg">Buscando as melhores opções...</p>
                        <div className="mt-8 w-full max-w-md space-y-4">
                           <div className="h-24 bg-white/5 rounded-2xl animate-pulse" />
                           <div className="h-24 bg-white/5 rounded-2xl animate-pulse" />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 sm:space-y-5">
                        {shippingOptions.map((opt) => (
                          <label key={opt.id} className={`relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 p-5 sm:p-6 rounded-2xl border-2 cursor-pointer transition-all overflow-hidden ${selectedShipping?.id === opt.id ? 'border-[#D4A017] bg-[#D4A017]/10 shadow-[0_0_20px_rgba(212,160,23,0.2)]' : 'border-white/10 bg-[#3A261A] hover:border-white/20 hover:bg-[#3A261A]/80'}`}>
                            <input type="radio" name="shipping" className="hidden" checked={selectedShipping?.id === opt.id} onChange={() => {
                                setSelectedShipping(opt);
                                setShippingCost(Number(opt.price));
                            }} />
                            <div className="flex items-center gap-4 w-full sm:w-auto">
                              <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${selectedShipping?.id === opt.id ? 'border-[#D4A017]' : 'border-white/30'}`}>
                                 {selectedShipping?.id === opt.id && <motion.div layoutId="shippingCheck" className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[#D4A017]" />}
                              </div>
                              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-sm flex items-center justify-center border shrink-0 transition-colors ${selectedShipping?.id === opt.id ? 'bg-[#D4A017] text-white border-transparent' : 'bg-white/5 text-[#E6D8C9] border-white/10'}`}>
                                 {opt.icon}
                              </div>
                              <div className="flex-1 min-w-0 sm:hidden">
                                 <h4 className="font-main font-bold text-white text-base truncate">{opt.company?.name}</h4>
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0 flex flex-col sm:block pl-10 sm:pl-0">
                               <h4 className="hidden sm:block font-main font-bold text-white text-lg truncate">{opt.company?.name}</h4>
                               {opt.description && <p className="text-xs sm:text-sm text-[#E6D8C9] mt-1 break-words">{opt.description}</p>}
                               <p className="text-xs sm:text-sm text-[#D4A017] mt-1 font-semibold">Prazo estimado: até {opt.delivery_time} dia(s)</p>
                            </div>
                            <div className="text-right shrink-0 pt-2 sm:pt-0 pl-10 sm:pl-0">
                               <span className="font-main font-bold text-xl sm:text-2xl text-white">R$ {Number(opt.price).toFixed(2).replace('.',',')}</span>
                            </div>
                          </label>
                        ))}
                        {shippingOptions.length === 0 && (
                          <div className="text-center p-10 bg-[#3A261A] rounded-2xl border border-white/5">
                             <p className="text-[#E6D8C9] text-lg">Infelizmente, nenhum frete foi encontrado para este CEP.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}

                {step === 'payment' && (
                  <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="max-w-2xl mx-auto space-y-8">
                    <div className="mb-10">
                      <h3 className="font-main text-3xl font-bold text-white mb-2">Pagamento Seguro</h3>
                      <p className="text-[#E6D8C9]">Última etapa para garantir seus produtos.</p>
                    </div>
                    
                    <div className="p-10 rounded-3xl bg-[#3A261A] border border-white/5 shadow-2xl text-center relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4A017]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                       <div className="relative z-10">
                         <div className="w-24 h-24 bg-white/5 text-[#D4A017] rounded-3xl flex items-center justify-center mx-auto mb-8 border border-white/10 shadow-lg">
                           <CreditCard className="w-12 h-12" />
                         </div>
                         <h4 className="font-main text-3xl font-bold text-white mb-4">Finalizar Pagamento</h4>
                         <p className="text-lg text-[#E6D8C9] mb-10 max-w-md mx-auto leading-relaxed">
                           Ambiente 100% seguro. Pague com PIX (aprovação instantânea) ou Cartão de Crédito.
                         </p>
                       </div>
                    </div>
                  </motion.div>
                )}

                {step === 'success' && (
                  <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-24 space-y-8">
                    <div className="w-32 h-32 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(16,185,129,0.2)] border border-emerald-500/20">
                      <CheckCircle2 className="w-16 h-16" />
                    </div>
                    <div>
                      <h3 className="font-main text-5xl font-bold text-white mb-4">Pedido Registrado!</h3>
                      <p className="text-[#E6D8C9] text-xl">Redirecionando para o pagamento...</p>
                    </div>

                    <button onClick={onClose} className="mt-12 px-12 py-6 bg-gradient-to-r from-[#D4A017] to-[#F2C94C] hover:brightness-110 text-white rounded-2xl font-bold uppercase tracking-widest transition-all shadow-xl active:scale-[0.98] text-lg inline-flex">
                      Voltar para a Loja
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Fixed Footer for Buttons */}
            {step !== 'success' && (
              <div className="checkout-footer bg-[#2C1B12] border-t border-white/5 z-20 shrink-0 lg:order-none order-last p-4 sm:p-6 lg:p-8">
                <div className="max-w-2xl mx-auto flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-4">
                  {step === 'customer' && (
                    <button disabled={!name || cpf.length < 14 || phone.length < 14 || !email} onClick={() => setStep('method')}
                      className="checkout-button w-full sm:w-auto sm:px-12 py-5 bg-gradient-to-r from-[#D4A017] to-[#F2C94C] hover:brightness-110 text-white rounded-2xl font-bold uppercase tracking-widest transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
                    >
                      Continuar <ArrowRight className="w-5 h-5" />
                    </button>
                  )}
                  {step === 'method' && (
                    <>
                      <button onClick={() => setStep('customer')} className="checkout-button sm:w-auto px-8 py-5 rounded-2xl font-bold text-[#E6D8C9] hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all uppercase tracking-wider text-sm">Voltar</button>
                      <button onClick={() => {
                          if (deliveryMethod === 'store') {
                            setShippingCost(0);
                            setSelectedShipping(null);
                            setStep('payment');
                          } else {
                            setStep('address');
                          }
                        }}
                        className="checkout-button flex-1 py-5 bg-gradient-to-r from-[#D4A017] to-[#F2C94C] hover:brightness-110 text-white rounded-2xl font-bold uppercase tracking-widest transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-3 text-lg"
                      >
                        Continuar <ArrowRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  {step === 'address' && (
                    <>
                      <button onClick={() => setStep('method')} className="checkout-button sm:w-auto px-8 py-5 rounded-2xl font-bold text-[#E6D8C9] hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all uppercase tracking-wider text-sm">Voltar</button>
                      <button disabled={!cep || !street || !number || !neighborhood || !city || !state} onClick={() => {
                          loadShippingOptions();
                          setStep('shipping');
                        }}
                        className="checkout-button flex-1 py-5 bg-gradient-to-r from-[#D4A017] to-[#F2C94C] hover:brightness-110 text-white rounded-2xl font-bold uppercase tracking-widest transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-3 text-lg"
                      >
                        Ver Fretes <ArrowRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  {step === 'shipping' && (
                    <>
                      <button onClick={() => setStep('address')} className="checkout-button sm:w-auto px-8 py-5 rounded-2xl font-bold text-[#E6D8C9] hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all uppercase tracking-wider text-sm">Voltar</button>
                      <button disabled={!selectedShipping} onClick={() => setStep('payment')}
                        className="checkout-button flex-1 py-5 bg-gradient-to-r from-[#D4A017] to-[#F2C94C] hover:brightness-110 text-white rounded-2xl font-bold uppercase tracking-widest transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-3 text-lg"
                      >
                        Continuar <ArrowRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  {step === 'payment' && (
                    <>
                      <button onClick={() => setStep(deliveryMethod === 'store' ? 'method' : 'shipping')} className="checkout-button sm:w-auto px-8 py-5 rounded-2xl font-bold text-[#E6D8C9] hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all uppercase tracking-wider text-sm">Voltar</button>
                      <button onClick={handleCheckout} disabled={isProcessing} className="checkout-button flex-1 py-5 bg-gradient-to-r from-[#D4A017] to-[#F2C94C] hover:brightness-110 text-white rounded-2xl font-bold uppercase tracking-widest transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-4 text-lg" >
                        {isProcessing ? 'Gerando pagamento...' : 'Finalizar Compra'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Premium Summary Sidebar */}
          {step !== 'success' && (
            <div className="checkout-summary hidden lg:flex flex-col w-[420px] bg-[#3A261A] border-l border-white/5 z-10 shadow-2xl relative min-h-0">
               <div className="p-8 border-b border-white/5 shrink-0">
                 <h3 className="font-main font-bold text-2xl text-white">Resumo da Compra</h3>
               </div>
               
               <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar min-h-0">
                 {cart.map(item => (
                   <div key={item.id} className="flex gap-5">
                     <div className="w-20 h-20 rounded-2xl bg-white/5 overflow-hidden border border-white/10 shrink-0">
                       {item.img ? (
                         <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center text-[#D4A017]"><Package className="w-8 h-8" /></div>
                       )}
                     </div>
                     <div className="flex-1 min-w-0 flex flex-col justify-center">
                       <h4 className="font-main font-bold text-white text-base truncate pr-2">{item.name}</h4>
                       <span className="text-sm text-[#E6D8C9] mt-1 uppercase tracking-wider text-[10px]">Qtd: {item.qty}</span>
                     </div>
                     <div className="font-bold text-[#D4A017] text-lg flex items-center shrink-0">
                       R$ {(item.price * item.qty).toFixed(2).replace('.', ',')}
                     </div>
                   </div>
                 ))}
               </div>

               <div className="p-8 bg-[#2C1B12]/50 border-t border-white/5 space-y-4 shrink-0">
                 <div className="flex justify-between text-base text-[#E6D8C9]">
                   <span>Subtotal</span>
                   <span className="font-medium">R$ {total.toFixed(2).replace('.', ',')}</span>
                 </div>
                 <div className="flex justify-between text-base text-[#E6D8C9]">
                   <span>Frete</span>
                   <span className={shippingCost === 0 ? "text-emerald-400 font-bold" : "text-white font-medium"}>
                     {deliveryMethod === 'store' ? 'Grátis (Retirada)' : shippingCost === 0 ? '--' : `R$ ${shippingCost.toFixed(2).replace('.', ',')}`}
                   </span>
                 </div>
                 <div className="pt-6 mt-4 border-t border-white/10 flex justify-between items-center">
                   <span className="font-main font-bold text-xl text-white">Total</span>
                   <span className="font-main font-bold text-4xl text-[#D4A017]">
                     R$ {finalTotal.toFixed(2).replace('.', ',')}
                   </span>
                 </div>
               </div>
            </div>
          )}

          {/* Mobile Summary Accordion (Simple Version) */}
          {step !== 'success' && (
            <div className="lg:hidden bg-[#3A261A] border-t border-white/5 p-6 space-y-3 shadow-[0_-10px_20px_rgba(0,0,0,0.2)]">
               <div className="flex justify-between text-sm text-[#E6D8C9]">
                 <span>Subtotal ({cart.reduce((a,b)=>a+b.qty,0)} itens)</span>
                 <span>R$ {total.toFixed(2).replace('.', ',')}</span>
               </div>
               <div className="flex justify-between text-sm text-[#E6D8C9]">
                 <span>Frete</span>
                 <span className={shippingCost === 0 ? "text-emerald-400 font-bold" : "text-white"}>
                   {deliveryMethod === 'store' ? 'Grátis (Retirada)' : shippingCost === 0 ? '--' : `R$ ${shippingCost.toFixed(2).replace('.', ',')}`}
                 </span>
               </div>
               <div className="flex justify-between items-center pt-3 border-t border-white/10">
                 <span className="font-main font-bold text-white">Total</span>
                 <span className="font-main font-bold text-2xl text-[#D4A017]">R$ {finalTotal.toFixed(2).replace('.', ',')}</span>
               </div>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}
