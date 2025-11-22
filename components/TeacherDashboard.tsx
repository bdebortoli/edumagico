
import React, { useState } from 'react';
import { User, ContentItem } from '../types';
import { Search, Plus, Edit, Trash2, Video, Volume2, Eye, Filter, DollarSign, TrendingUp, Download, Calendar } from 'lucide-react';

interface TeacherDashboardProps {
  user: User;
  myContent: ContentItem[];
  onCreateNew: () => void;
  onEditContent: (content: ContentItem) => void;
  onDeleteContent: (id: string) => void;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ user, myContent, onCreateNew, onEditContent, onDeleteContent }) => {
  const [view, setView] = useState<'content' | 'financial'>('content');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter Content
  const filteredContent = myContent.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.grade?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Financial Logic (Mock Calculation)
  const totalSalesCount = myContent.reduce((acc, curr) => acc + (curr.salesCount || 0), 0);
  const totalGrossRevenue = myContent.reduce((acc, curr) => acc + (curr.salesCount || 0) * curr.price, 0);
  const platformFee = totalGrossRevenue * 0.15; // 15% fee
  const netRevenue = totalGrossRevenue - platformFee;
  
  const paidAmount = netRevenue * 0.8; // 80% already paid mock
  const pendingAmount = netRevenue * 0.2; // 20% pending mock

  const monthlySales = [
    { month: 'Jan', value: totalGrossRevenue * 0.1 },
    { month: 'Fev', value: totalGrossRevenue * 0.15 },
    { month: 'Mar', value: totalGrossRevenue * 0.12 },
    { month: 'Abr', value: totalGrossRevenue * 0.2 },
    { month: 'Mai', value: totalGrossRevenue * 0.25 },
    { month: 'Jun', value: totalGrossRevenue * 0.18 },
  ];

  return (
    <div className="animate-fade-in space-y-8">
      {/* Teacher Header */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-indigo-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
           <h2 className="text-3xl font-black text-indigo-900 font-fredoka mb-2">Área do Educador</h2>
           <p className="text-slate-600">Gerencie suas aulas, finanças e crie materiais.</p>
        </div>
        <div className="flex gap-3">
            <button 
            onClick={() => setView('financial')}
            className={`px-6 py-3 rounded-xl font-bold transition flex items-center gap-2 ${view === 'financial' ? 'bg-indigo-100 text-indigo-700' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
               <DollarSign className="w-5 h-5" /> Financeiro
            </button>
            <button 
            onClick={onCreateNew}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 transition flex items-center gap-2"
            >
               <Plus className="w-5 h-5" /> Criar Conteúdo
            </button>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex border-b border-slate-200">
          <button 
            onClick={() => setView('content')}
            className={`px-6 py-3 font-bold text-sm border-b-2 transition ${view === 'content' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Meus Materiais
          </button>
          <button 
            onClick={() => setView('financial')}
            className={`px-6 py-3 font-bold text-sm border-b-2 transition ${view === 'financial' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Painel Financeiro
          </button>
      </div>

      {/* CONTENT VIEW */}
      {view === 'content' && (
          <div className="animate-fade-in">
            {/* Search & Tools */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
                    <input 
                    type="text" 
                    placeholder="Buscar em seus materiais por título, matéria ou série..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-slate-600 bg-white"
                    />
                </div>
            </div>

            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                Meus Materiais <span className="bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded-full">{filteredContent.length}</span>
            </h3>
            
            {filteredContent.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                    <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Filter className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-bold">Nenhum material encontrado.</p>
                    <button onClick={onCreateNew} className="text-indigo-600 font-bold text-sm mt-2 hover:underline">Comece criando sua primeira aula</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredContent.map(item => (
                    <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition flex gap-4">
                        <div className={`w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            item.type === 'story' ? 'bg-orange-100 text-orange-600' : 
                            item.type === 'quiz' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'
                        }`}>
                            {item.type === 'story' ? '📖' : item.type === 'quiz' ? '🎲' : '📝'}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <h4 className="font-bold text-slate-800 truncate pr-2">{item.title}</h4>
                                <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-full uppercase">
                                    {item.type === 'story' ? 'História' : item.type === 'quiz' ? 'Quiz' : 'Resumo'}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mb-2 line-clamp-1">{item.description}</p>
                            
                            <div className="flex flex-wrap gap-2 mb-3">
                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{item.subject}</span>
                                {item.grade && <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded">{item.grade}</span>}
                                {item.price > 0 && <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">C$ {item.price}</span>}
                            </div>

                            <div className="flex gap-2 border-t border-slate-50 pt-2">
                                <button onClick={() => onEditContent(item)} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-bold text-slate-600 bg-slate-50 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition">
                                <Edit className="w-3 h-3" /> Editar
                                </button>
                                <button onClick={() => onDeleteContent(item.id)} className="px-3 py-1.5 text-xs font-bold text-red-400 bg-red-50 rounded-lg hover:bg-red-100 hover:text-red-600 transition">
                                <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    </div>
                    ))}
                </div>
            )}
          </div>
      )}

      {/* FINANCIAL VIEW */}
      {view === 'financial' && (
          <div className="animate-fade-in space-y-6">
              {/* Financial Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
                      <div className="absolute right-0 top-0 p-4 opacity-10"><TrendingUp className="w-24 h-24 text-green-600" /></div>
                      <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-1">Vendas Totais</p>
                      <h3 className="text-3xl font-black text-slate-800">R$ {totalGrossRevenue.toFixed(2)}</h3>
                      <p className="text-xs text-slate-400 mt-2">{totalSalesCount} itens vendidos</p>
                  </div>
                  <div className="bg-green-50 p-6 rounded-3xl shadow-sm border border-green-100">
                      <p className="text-green-600 font-bold text-xs uppercase tracking-wider mb-1">Repasses Realizados</p>
                      <h3 className="text-3xl font-black text-green-800">R$ {paidAmount.toFixed(2)}</h3>
                      <p className="text-xs text-green-600 mt-2 flex items-center gap-1"><Calendar className="w-3 h-3"/> Último pgto: 15/06</p>
                  </div>
                  <div className="bg-orange-50 p-6 rounded-3xl shadow-sm border border-orange-100">
                      <p className="text-orange-600 font-bold text-xs uppercase tracking-wider mb-1">A Receber</p>
                      <h3 className="text-3xl font-black text-orange-800">R$ {pendingAmount.toFixed(2)}</h3>
                      <p className="text-xs text-orange-600 mt-2">Próximo fechamento: 30/06</p>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Monthly Sales Chart */}
                  <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                      <h4 className="font-bold text-slate-700 mb-6">Vendas Mensais</h4>
                      <div className="flex items-end justify-between h-48 gap-2 px-2">
                          {monthlySales.map((data, idx) => (
                              <div key={idx} className="flex flex-col items-center gap-2 flex-1 group">
                                  <div className="w-full bg-indigo-50 rounded-t-lg relative h-full flex items-end group-hover:bg-indigo-100 transition">
                                      <div 
                                        className="w-full bg-indigo-600 rounded-t-lg transition-all duration-1000" 
                                        style={{ height: `${(data.value / totalGrossRevenue) * 250}%` }}
                                      ></div>
                                      <div className="absolute -top-8 w-full text-center text-xs font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition">
                                          R${data.value.toFixed(0)}
                                      </div>
                                  </div>
                                  <span className="text-xs font-bold text-slate-400">{data.month}</span>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* DRE / Report Table */}
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                       <div className="flex justify-between items-center mb-4">
                          <h4 className="font-bold text-slate-700">DRE Anual</h4>
                          <button className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg"><Download className="w-4 h-4"/></button>
                       </div>
                       <div className="space-y-3 text-sm">
                           <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                               <span className="text-slate-600">Receita Bruta</span>
                               <span className="font-bold text-slate-800">R$ {totalGrossRevenue.toFixed(2)}</span>
                           </div>
                           <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                               <span className="text-slate-500">Taxa Plataforma (15%)</span>
                               <span className="text-red-400">- R$ {platformFee.toFixed(2)}</span>
                           </div>
                           <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                               <span className="text-slate-500">Impostos (Est.)</span>
                               <span className="text-red-400">- R$ 0,00</span>
                           </div>
                           <div className="flex justify-between items-center pt-2">
                               <span className="font-bold text-slate-800">Resultado Líquido</span>
                               <span className="font-black text-green-600">R$ {netRevenue.toFixed(2)}</span>
                           </div>
                       </div>
                       
                       <div className="mt-6 bg-slate-50 p-4 rounded-xl text-xs text-slate-500 leading-relaxed">
                           * Os repasses são realizados todo dia 15. O valor mínimo para saque é R$ 50,00.
                       </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
