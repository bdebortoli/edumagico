
import React, { useState } from 'react';
import { Check, CreditCard, Shield, Star, Calendar, Zap } from 'lucide-react';
import { User, PlanType, SubscriptionCycle } from '../types';
import { formatarNumeroCartao, formatarDataValidade, formatarCVC } from '../services/cardService';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';

interface SubscriptionPageProps {
  currentUser: User;
  onUpgrade: (plan: PlanType, cycle: SubscriptionCycle) => void;
}

const SubscriptionPage: React.FC<SubscriptionPageProps> = ({ currentUser, onUpgrade }) => {
  const [cycle, setCycle] = useState<SubscriptionCycle>('monthly');
  const [loading, setLoading] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [cardData, setCardData] = useState({
    name: '',
    number: '',
    expiry: '',
    cvc: ''
  });

  const handleSubscribe = async () => {
    setLoading(true);
    const token = localStorage.getItem('token') || '';
    
    try {
      const res = await fetch(`${API_BASE}/users/subscription`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          plan: 'premium',
          cycle: cycle
        })
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || 'Erro ao atualizar assinatura');
        setLoading(false);
        return;
      }

      const data = await res.json();
      onUpgrade('premium', cycle);
      alert('Assinatura atualizada com sucesso! Bem-vindo ao Premium.');
    } catch (error) {
      console.error('Error updating subscription:', error);
      alert('Erro ao atualizar assinatura. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-black text-slate-900 font-fredoka mb-4">Escolha o Plano Ideal</h2>
        <p className="text-slate-600 max-w-2xl mx-auto text-lg">
          Desbloqueie todo o potencial do EduMágico e transforme o aprendizado dos seus filhos.
        </p>
        
        {/* Toggle */}
        <div className="flex items-center justify-center mt-8 gap-4">
          <span className={`font-bold ${cycle === 'monthly' ? 'text-indigo-600' : 'text-slate-400'}`}>Mensal</span>
          <button 
            onClick={() => setCycle(cycle === 'monthly' ? 'yearly' : 'monthly')}
            className="w-16 h-8 bg-indigo-100 rounded-full relative cursor-pointer transition-colors hover:bg-indigo-200"
          >
            <div className={`absolute top-1 w-6 h-6 bg-indigo-600 rounded-full shadow-md transition-all duration-300 ${cycle === 'monthly' ? 'left-1' : 'left-9'}`}></div>
          </button>
          <span className={`font-bold flex items-center gap-2 ${cycle === 'yearly' ? 'text-indigo-600' : 'text-slate-400'}`}>
            Anual 
            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold">-20% OFF</span>
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Free Plan */}
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
          <h3 className="text-xl font-bold text-slate-500 mb-2">Plano Básico</h3>
          <div className="text-4xl font-black text-slate-800 mb-6">Grátis</div>
          <p className="text-slate-600 mb-8">Ideal para conhecer a plataforma e acessar conteúdos públicos.</p>
          
          <ul className="space-y-4 mb-8">
            <li className="flex items-center gap-3 text-slate-700">
              <Check className="w-5 h-5 text-green-500" /> Acesso à biblioteca pública
            </li>
            <li className="flex items-center gap-3 text-slate-700">
              <Check className="w-5 h-5 text-green-500" /> 1 Perfil de criança
            </li>
            <li className="flex items-center gap-3 text-slate-700">
              <Check className="w-5 h-5 text-green-500" /> Relatórios básicos
            </li>
            <li className="flex items-center gap-3 text-slate-400 line-through">
              <Zap className="w-5 h-5" /> Criação com IA Mágica
            </li>
          </ul>
          
          <button className="w-full py-4 rounded-xl font-bold border-2 border-slate-200 text-slate-500 cursor-not-allowed">
            Seu plano atual
          </button>
        </div>

        {/* Premium Plan */}
        <div className="bg-indigo-600 rounded-3xl p-8 border border-indigo-500 shadow-xl text-white relative overflow-hidden transform scale-105">
          <div className="absolute -top-10 -right-10 bg-white/10 w-64 h-64 rounded-full blur-3xl"></div>
          
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xl font-bold text-indigo-100">EduMágico Premium</h3>
            <Star className="fill-yellow-400 text-yellow-400 animate-pulse" />
          </div>
          
          <div className="text-5xl font-black text-white mb-1">
            {cycle === 'monthly' ? 'R$ 29,90' : 'R$ 23,90'}
            <span className="text-lg font-medium text-indigo-200">/mês</span>
          </div>
          <p className="text-indigo-200 text-sm mb-6">
            {cycle === 'yearly' ? 'Cobrado R$ 286,80 anualmente' : 'Cobrado mensalmente'}
          </p>

          <ul className="space-y-4 mb-8 relative z-10">
            <li className="flex items-center gap-3">
              <div className="bg-indigo-500 p-1 rounded-full"><Check className="w-4 h-4" /></div>
              Criação ilimitada com IA
            </li>
            <li className="flex items-center gap-3">
              <div className="bg-indigo-500 p-1 rounded-full"><Check className="w-4 h-4" /></div>
              Até 4 perfis de crianças
            </li>
            <li className="flex items-center gap-3">
              <div className="bg-indigo-500 p-1 rounded-full"><Check className="w-4 h-4" /></div>
              Relatórios de desempenho detalhados
            </li>
            <li className="flex items-center gap-3">
              <div className="bg-indigo-500 p-1 rounded-full"><Check className="w-4 h-4" /></div>
              Jogos exclusivos e suporte prioritário
            </li>
          </ul>

          {/* Payment Form */}
          {showPaymentForm && (
            <div className="bg-white/10 p-4 rounded-xl mb-6 backdrop-blur-sm border border-white/20">
              <h4 className="text-sm font-bold mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4"/> Pagamento Seguro</h4>
              <div className="space-y-3">
                <input 
                  type="text"
                  value={cardData.name}
                  onChange={(e) => setCardData({ ...cardData, name: e.target.value.toUpperCase() })}
                  placeholder="Nome no Cartão" 
                  className="w-full bg-black/20 border border-indigo-400 rounded-lg px-3 py-2 text-sm text-white placeholder-indigo-300 outline-none focus:border-white" 
                />
                <input 
                  type="text"
                  value={cardData.number}
                  onChange={(e) => setCardData({ ...cardData, number: formatarNumeroCartao(e.target.value) })}
                  placeholder="0000 0000 0000 0000" 
                  maxLength={19}
                  className="w-full bg-black/20 border border-indigo-400 rounded-lg px-3 py-2 text-sm text-white placeholder-indigo-300 outline-none focus:border-white" 
                />
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={cardData.expiry}
                    onChange={(e) => setCardData({ ...cardData, expiry: formatarDataValidade(e.target.value) })}
                    placeholder="MM/AA" 
                    maxLength={5}
                    className="w-1/2 bg-black/20 border border-indigo-400 rounded-lg px-3 py-2 text-sm text-white placeholder-indigo-300 outline-none focus:border-white" 
                  />
                  <input 
                    type="text"
                    value={cardData.cvc}
                    onChange={(e) => setCardData({ ...cardData, cvc: formatarCVC(e.target.value) })}
                    placeholder="CVC" 
                    maxLength={3}
                    className="w-1/2 bg-black/20 border border-indigo-400 rounded-lg px-3 py-2 text-sm text-white placeholder-indigo-300 outline-none focus:border-white" 
                  />
                </div>
              </div>
            </div>
          )}
          
          {!showPaymentForm && (
            <div className="bg-white/10 p-4 rounded-xl mb-6 backdrop-blur-sm border border-white/20">
              <h4 className="text-sm font-bold mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4"/> Pagamento Seguro</h4>
              <button
                type="button"
                onClick={() => setShowPaymentForm(true)}
                className="w-full bg-white/20 hover:bg-white/30 text-white text-sm py-2 rounded-lg transition font-bold"
              >
                Adicionar Cartão
              </button>
            </div>
          )}
          
          <button 
            onClick={handleSubscribe}
            disabled={loading || currentUser.plan === 'premium' || (showPaymentForm && (!cardData.number || !cardData.expiry || !cardData.cvc))}
            className="w-full bg-white text-indigo-600 py-4 rounded-xl font-bold hover:bg-indigo-50 transition shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Processando...' : currentUser.plan === 'premium' ? 'Plano Ativo' : 'Assinar Premium Agora'}
          </button>
          <p className="text-center text-xs text-indigo-300 mt-4 flex items-center justify-center gap-1">
            <Shield className="w-3 h-3" /> Cancelamento fácil a qualquer momento
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
