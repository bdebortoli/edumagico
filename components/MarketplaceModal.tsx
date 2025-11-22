
import React, { useState } from 'react';
import { ContentItem, User } from '../types';
import { X, Star, ShieldCheck, CreditCard, BookOpen, Lock, CheckCircle, Sparkles, User as UserIcon } from 'lucide-react';
import { formatarNumeroCartao, formatarDataValidade, formatarCVC } from '../services/cardService';

interface MarketplaceModalProps {
  content: ContentItem;
  user: User;
  onClose: () => void;
  onBuy: (content: ContentItem) => void;
}

const MarketplaceModal: React.FC<MarketplaceModalProps> = ({ content, user, onClose, onBuy }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'details' | 'payment' | 'success'>('details');
  const [cardData, setCardData] = useState({
    name: '',
    number: '',
    expiry: '',
    cvc: ''
  });

  const handleBuyClick = () => {
    setStep('payment');
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsProcessing(false);
      setStep('success');
      setTimeout(() => {
          onBuy(content);
      }, 2000);
    }, 2000);
  };

  // Render content preview based on type
  const renderPreview = () => {
    if (content.type === 'story') {
      const data = content.data as any;
      return (
        <div className="relative">
           <h4 className="font-bold mb-2 text-lg">{data.chapters[0].title}</h4>
           <p className="text-slate-600 leading-relaxed">{data.chapters[0].text.substring(0, 150)}...</p>
           <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent flex items-end justify-center pb-4">
              <span className="text-indigo-600 font-bold text-sm bg-indigo-50 px-3 py-1 rounded-full flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Prévia do Capítulo 1
              </span>
           </div>
        </div>
      );
    }
    if (content.type === 'quiz') {
        const data = content.data as any;
        return (
            <div className="relative p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-400 uppercase">Questão 1</span>
                <h4 className="font-bold mb-4 text-slate-800">{data.questions[0].question}</h4>
                <div className="space-y-2 filter blur-[2px]">
                   {data.questions[0].options.map((opt: string, i: number) => (
                       <div key={i} className="p-2 border rounded-lg text-slate-400 text-sm">{opt}</div>
                   ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-[1px]">
                     <span className="text-indigo-600 font-bold text-sm bg-white shadow-sm px-3 py-1 rounded-full flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Compre para liberar o Quiz
                    </span>
                </div>
            </div>
        );
    }
    return <p className="text-slate-500 italic">Prévia indisponível para este formato.</p>;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden relative min-h-[600px] flex flex-col md:flex-row">
        
        <button onClick={onClose} className="absolute top-4 right-4 z-10 bg-black/10 hover:bg-black/20 p-2 rounded-full transition text-slate-600">
            <X className="w-5 h-5" />
        </button>

        {/* Left Side: Content Info */}
        <div className="w-full md:w-1/2 bg-slate-50 p-8 border-r border-slate-100 flex flex-col">
            <div className="flex items-center gap-2 text-indigo-600 font-bold mb-4 text-sm uppercase tracking-wide">
               <Sparkles className="w-4 h-4" /> Material Premium
            </div>
            
            <h2 className="text-3xl font-black text-slate-900 font-fredoka mb-2 leading-tight">{content.title}</h2>
            <p className="text-slate-600 mb-6 text-lg">{content.description}</p>

            <div className="flex flex-wrap gap-2 mb-6">
                <span className="bg-white border border-slate-200 px-3 py-1 rounded-lg text-xs font-bold text-slate-600 uppercase">{content.subject}</span>
                <span className="bg-white border border-slate-200 px-3 py-1 rounded-lg text-xs font-bold text-slate-600 uppercase">{content.grade}</span>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-500" /> Espiadinha no Conteúdo
                </h3>
                {renderPreview()}
            </div>

            <div className="mt-auto flex items-center gap-4 pt-6 border-t border-slate-200">
                 <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl">
                     {content.authorName.charAt(0)}
                 </div>
                 <div>
                     <p className="font-bold text-slate-800 text-sm">Criado por {content.authorName}</p>
                     <div className="flex items-center gap-1 text-xs text-yellow-500">
                         <Star className="w-3 h-3 fill-current" />
                         <Star className="w-3 h-3 fill-current" />
                         <Star className="w-3 h-3 fill-current" />
                         <Star className="w-3 h-3 fill-current" />
                         <Star className="w-3 h-3 fill-current" />
                         <span className="text-slate-400 ml-1">(128 avaliações)</span>
                     </div>
                 </div>
            </div>
        </div>

        {/* Right Side: Action / Payment */}
        <div className="w-full md:w-1/2 p-8 flex flex-col justify-center bg-white relative">
            
            {step === 'details' && (
                <div className="animate-fade-in">
                    <div className="text-center mb-8">
                        <p className="text-slate-500 font-bold uppercase text-xs mb-2">Investimento</p>
                        <div className="text-5xl font-black text-slate-900 font-fredoka flex justify-center items-start gap-1">
                            <span className="text-2xl mt-1">C$</span>{content.price}
                        </div>
                        <p className="text-indigo-600 text-sm font-bold mt-2">Moedas EduMágico</p>
                    </div>

                    <ul className="space-y-4 mb-8 max-w-xs mx-auto">
                        <li className="flex items-center gap-3 text-slate-600 text-sm">
                            <CheckCircle className="w-5 h-5 text-green-500" /> Acesso vitalício ao material
                        </li>
                        <li className="flex items-center gap-3 text-slate-600 text-sm">
                            <CheckCircle className="w-5 h-5 text-green-500" /> Editável e adaptável
                        </li>
                        <li className="flex items-center gap-3 text-slate-600 text-sm">
                            <CheckCircle className="w-5 h-5 text-green-500" /> Suporte do professor
                        </li>
                    </ul>

                    <button 
                        onClick={handleBuyClick}
                        className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition shadow-xl shadow-indigo-200 mb-4 hover:scale-[1.02] transform"
                    >
                        Comprar Agora
                    </button>
                    <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Garantia de satisfação de 7 dias
                    </p>
                </div>
            )}

            {step === 'payment' && (
                <form onSubmit={handleConfirmPayment} className="animate-fade-in">
                    <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-indigo-600" /> Pagamento Seguro
                    </h3>
                    
                    <div className="space-y-4 mb-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome no Cartão</label>
                            <input 
                                required 
                                type="text" 
                                value={cardData.name}
                                onChange={(e) => setCardData({ ...cardData, name: e.target.value.toUpperCase() })}
                                placeholder="Ex: CLAUDIA SANTOS" 
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold" 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Número do Cartão</label>
                            <input 
                                required 
                                type="text" 
                                value={cardData.number}
                                onChange={(e) => setCardData({ ...cardData, number: formatarNumeroCartao(e.target.value) })}
                                placeholder="0000 0000 0000 0000" 
                                maxLength={19}
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold" 
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Validade</label>
                                <input 
                                    required 
                                    type="text" 
                                    value={cardData.expiry}
                                    onChange={(e) => setCardData({ ...cardData, expiry: formatarDataValidade(e.target.value) })}
                                    placeholder="MM/AA" 
                                    maxLength={5}
                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CVC</label>
                                <input 
                                    required 
                                    type="text" 
                                    value={cardData.cvc}
                                    onChange={(e) => setCardData({ ...cardData, cvc: formatarCVC(e.target.value) })}
                                    placeholder="123" 
                                    maxLength={3}
                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold" 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl flex justify-between items-center mb-6 border border-slate-100">
                        <span className="text-sm font-bold text-slate-600">Total a pagar</span>
                        <span className="text-xl font-black text-slate-900">R$ {(content.price * 0.5).toFixed(2)}</span>
                    </div>

                    <button 
                        type="submit"
                        disabled={isProcessing}
                        className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-green-700 transition shadow-xl shadow-green-200 disabled:opacity-70 flex justify-center items-center gap-2"
                    >
                        {isProcessing ? 'Processando...' : 'Finalizar Compra'}
                    </button>
                    <button type="button" onClick={() => setStep('details')} className="w-full mt-4 text-slate-500 font-bold text-sm hover:text-slate-800">
                        Cancelar
                    </button>
                </form>
            )}

            {step === 'success' && (
                <div className="text-center animate-fade-in">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-slow">
                        <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">Compra realizada!</h3>
                    <p className="text-slate-600 mb-8">O material já está disponível na sua biblioteca.</p>
                    <p className="text-sm text-slate-400">Redirecionando...</p>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default MarketplaceModal;
