
import React, { useState } from 'react';
import { ActivityHistory, User } from '../types';
import { BarChart3, TrendingUp, Calendar, Award } from 'lucide-react';

interface PerformanceAnalyticsProps {
  user: User;
}

const PerformanceAnalytics: React.FC<PerformanceAnalyticsProps> = ({ user }) => {
  const [selectedChildId, setSelectedChildId] = useState<string>(user.children?.[0]?.id || '');

  const history = user.activityHistory || [];
  const childHistory = history.filter(h => h.childId === selectedChildId);
  
  // Aggregate data by Subject
  const subjects = ['Matemática', 'Português', 'História', 'Geografia', 'Ciências', 'Inglês'];
  
  const subjectStats = subjects.map(subject => {
    const activities = childHistory.filter(h => h.subject === subject);
    const total = activities.length;
    if (total === 0) return { subject, avg: 0, total: 0 };
    
    const totalScore = activities.reduce((sum, item) => sum + (item.score / item.maxScore) * 100, 0);
    return {
      subject,
      avg: Math.round(totalScore / total),
      total
    };
  });

  const selectedChild = user.children?.find(c => c.id === selectedChildId);

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 font-fredoka">Desempenho Escolar</h2>
          <p className="text-slate-500">Acompanhe a evolução em cada matéria.</p>
        </div>
        
        {/* Child Selector */}
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
           {user.children?.map(child => (
             <button
               key={child.id}
               onClick={() => setSelectedChildId(child.id)}
               className={`px-4 py-2 rounded-lg font-bold text-sm transition flex items-center gap-2 ${selectedChildId === child.id ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
             >
               <img src={child.avatar} className="w-6 h-6 rounded-full" alt="" />
               {child.name}
             </button>
           ))}
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
           <div className="flex items-center gap-3 mb-2 text-slate-500 font-bold text-sm uppercase tracking-wider">
             <Award className="w-5 h-5 text-orange-500" /> Atividades Concluídas
           </div>
           <p className="text-4xl font-black text-slate-800">{childHistory.length}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
           <div className="flex items-center gap-3 mb-2 text-slate-500 font-bold text-sm uppercase tracking-wider">
             <TrendingUp className="w-5 h-5 text-green-500" /> Média Geral
           </div>
           <p className="text-4xl font-black text-slate-800">
             {childHistory.length > 0 
               ? Math.round(childHistory.reduce((acc, curr) => acc + (curr.score/curr.maxScore)*100, 0) / childHistory.length) 
               : 0}%
           </p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
           <div className="flex items-center gap-3 mb-2 text-slate-500 font-bold text-sm uppercase tracking-wider">
             <Calendar className="w-5 h-5 text-blue-500" /> Última Atividade
           </div>
           <p className="text-lg font-bold text-slate-800">
             {childHistory.length > 0 
               ? new Date(childHistory[childHistory.length - 1].completedAt).toLocaleDateString('pt-BR') 
               : '-'}
           </p>
        </div>
      </div>

      {/* Performance Bars by Subject */}
      <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-8 mb-8">
         <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" /> Rendimento por Matéria
         </h3>
         
         <div className="space-y-6">
            {subjectStats.map((stat) => (
              <div key={stat.subject}>
                <div className="flex justify-between mb-2">
                   <span className="font-bold text-slate-700">{stat.subject}</span>
                   <span className="font-bold text-slate-500">{stat.avg}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
                   <div 
                     className={`h-full rounded-full transition-all duration-1000 ${
                       stat.avg >= 80 ? 'bg-green-500' : 
                       stat.avg >= 60 ? 'bg-blue-500' : 
                       stat.avg > 0 ? 'bg-orange-400' : 'bg-slate-300'
                     }`}
                     style={{ width: `${stat.avg}%` }}
                   ></div>
                </div>
                <p className="text-xs text-slate-400 mt-1 text-right">{stat.total} atividades</p>
              </div>
            ))}
         </div>
      </div>

      {/* Recent History List */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
         <h3 className="text-xl font-bold text-slate-800 mb-6">Histórico Recente</h3>
         {childHistory.length === 0 ? (
           <p className="text-slate-500 italic">Nenhuma atividade realizada ainda.</p>
         ) : (
           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead>
                 <tr className="border-b border-slate-100 text-slate-400 text-sm uppercase tracking-wider">
                   <th className="pb-3 font-bold">Atividade</th>
                   <th className="pb-3 font-bold">Matéria</th>
                   <th className="pb-3 font-bold">Data</th>
                   <th className="pb-3 font-bold text-right">Nota</th>
                 </tr>
               </thead>
               <tbody className="text-slate-700">
                 {childHistory.slice().reverse().slice(0, 5).map((item) => (
                   <tr key={item.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition">
                     <td className="py-4 font-bold">{item.contentTitle}</td>
                     <td className="py-4 text-sm">
                        <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md text-xs font-bold">{item.subject}</span>
                     </td>
                     <td className="py-4 text-sm text-slate-500">{new Date(item.completedAt).toLocaleDateString('pt-BR')}</td>
                     <td className="py-4 text-right font-bold">
                        <span className={`${item.score/item.maxScore >= 0.7 ? 'text-green-600' : 'text-orange-500'}`}>
                          {Math.round((item.score/item.maxScore)*100)}%
                        </span>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         )}
      </div>

    </div>
  );
};

export default PerformanceAnalytics;
