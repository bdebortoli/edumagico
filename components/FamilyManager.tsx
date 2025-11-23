
import React, { useState, useEffect } from 'react';
import { User, ChildProfile } from '../types';
import { Plus, Trash2, User as UserIcon, Lock, Pencil, X, RefreshCw, ChevronRight, ChevronLeft, Smile, Bot, Ghost, MapPin, School } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface FamilyManagerProps {
  user: User;
  onUpdateChildren: (children: ChildProfile[]) => void;
  onNavigateToUpgrade: () => void;
}

const GRADE_OPTIONS = [
  "Pré-escola", 
  "1º Ano Fund.", "2º Ano Fund.", "3º Ano Fund.", "4º Ano Fund.", "5º Ano Fund.",
  "6º Ano Fund.", "7º Ano Fund.", "8º Ano Fund.", "9º Ano Fund.",
  "1º Ano Médio", "2º Ano Médio", "3º Ano Médio"
];

const AVATAR_STYLES = [
  { id: 'avataaars', name: 'Humano', icon: <Smile className="w-4 h-4"/> },
  { id: 'bottts', name: 'Robô', icon: <Bot className="w-4 h-4"/> },
  { id: 'thumbs', name: 'Monstrinho', icon: <Ghost className="w-4 h-4"/> }, 
];

interface IBGEState {
  id: number;
  sigla: string;
  nome: string;
}

interface IBGECity {
  id: number;
  nome: string;
}

const FamilyManager: React.FC<FamilyManagerProps> = ({ user, onUpdateChildren, onNavigateToUpgrade }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Carrega children do backend ao montar o componente
  useEffect(() => {
    const loadChildren = async () => {
      const token = localStorage.getItem('token') || '';
      try {
        const res = await fetch(`${API_BASE}/family/children`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          onUpdateChildren(data.children || []);
        }
      } catch (error) {
        console.error('Error loading children:', error);
      }
    };
    loadChildren();
  }, [onUpdateChildren]);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    age: 7,
    grade: '2º Ano Fund.',
    school: '',
    state: '',
    city: '',
    avatarStyle: 'avataaars',
    avatarSeed: 'Pedro'
  });

  // Location Data State
  const [statesList, setStatesList] = useState<IBGEState[]>([]);
  const [citiesList, setCitiesList] = useState<IBGECity[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  // Logic based on requirements: Basic = 1 child, Premium = 4
  const maxChildren = user.plan === 'premium' ? 4 : 1;
  const currentCount = user.children?.length || 0;
  const canAdd = currentCount < maxChildren;

  // Fetch States on Mount
  useEffect(() => {
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      .then(res => res.json())
      .then(data => setStatesList(data))
      .catch(err => console.error("Erro ao buscar estados", err));
  }, []);

  // Fetch Cities when State changes
  useEffect(() => {
    if (formData.state) {
      setIsLoadingCities(true);
      fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${formData.state}/municipios`)
        .then(res => res.json())
        .then(data => {
            setCitiesList(data);
            setIsLoadingCities(false);
        })
        .catch(err => {
            console.error("Erro ao buscar cidades", err);
            setIsLoadingCities(false);
        });
    } else {
        setCitiesList([]);
    }
  }, [formData.state]);

  const openModal = (child?: ChildProfile) => {
    if (child) {
      // Edit Mode
      setEditingId(child.id);
      
      let style = 'avataaars';
      let seed = child.name;
      
      if (child.avatar) {
         const parts = child.avatar.split('/');
         if (parts.length > 4) {
            style = parts[4]; 
            const query = child.avatar.split('seed=')[1];
            if (query) seed = query;
         }
      }

      setFormData({
        name: child.name,
        age: child.age,
        grade: child.grade,
        school: child.school || '',
        state: child.state || '',
        city: child.city || '',
        avatarStyle: style,
        avatarSeed: seed
      });
    } else {
      // Create Mode
      setEditingId(null);
      setFormData({
        name: '',
        age: 7,
        grade: '1º Ano Fund.',
        school: '',
        state: '',
        city: '',
        avatarStyle: 'avataaars',
        avatarSeed: Math.random().toString(36).substring(7)
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const token = localStorage.getItem('token') || '';
    const avatarUrl = `https://api.dicebear.com/7.x/${formData.avatarStyle}/svg?seed=${formData.avatarSeed}`;

    try {
      if (editingId) {
        // Update existing
        const res = await fetch(`${API_BASE}/family/children/${editingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: formData.name,
            age: formData.age,
            grade: formData.grade,
            school: formData.school,
            state: formData.state,
            city: formData.city,
            avatar: avatarUrl
          })
        });

        if (!res.ok) {
          const error = await res.json();
          alert(error.error || 'Erro ao atualizar perfil');
          return;
        }

        const data = await res.json();
        // Atualiza a lista local
        const updatedChildren = (user.children || []).map(child => 
          child.id === editingId ? data.child : child
        );
        onUpdateChildren(updatedChildren);
      } else {
        // Create new
        const res = await fetch(`${API_BASE}/family/children`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: formData.name,
            age: formData.age,
            grade: formData.grade,
            school: formData.school,
            state: formData.state,
            city: formData.city,
            avatar: avatarUrl
          })
        });

        if (!res.ok) {
          const error = await res.json();
          alert(error.error || 'Erro ao criar perfil');
          return;
        }

        const data = await res.json();
        // Adiciona o novo filho à lista local
        onUpdateChildren([...(user.children || []), data.child]);
      }

      setIsModalOpen(false);
      // Limpa o formulário
      setFormData({
        name: '',
        age: 7,
        grade: '2º Ano Fund.',
        school: '',
        state: '',
        city: '',
        avatarStyle: 'avataaars',
        avatarSeed: 'Pedro'
      });
      setEditingId(null);
    } catch (error) {
      console.error('Error saving child:', error);
      alert('Erro ao salvar perfil. Tente novamente.');
    }
  };

  const handleRemoveChild = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este perfil? O histórico e os pontos serão perdidos.')) {
      return;
    }

    const token = localStorage.getItem('token') || '';
    
    try {
      const res = await fetch(`${API_BASE}/family/children/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || 'Erro ao remover perfil');
        return;
      }

      // Remove da lista local
      onUpdateChildren((user.children || []).filter(c => c.id !== id));
    } catch (error) {
      console.error('Error removing child:', error);
      alert('Erro ao remover perfil. Tente novamente.');
    }
  };

  const randomizeAvatar = () => {
    setFormData(prev => ({ ...prev, avatarSeed: Math.random().toString(36).substring(7) }));
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in relative">
      
      <div className="flex justify-between items-center mb-8">
        <div>
            <h2 className="text-3xl font-black text-slate-900 font-fredoka">Minha Família</h2>
            <p className="text-slate-500">Gerencie os perfis de quem está aprendendo.</p>
        </div>
        <div className="bg-indigo-50 px-4 py-2 rounded-full text-indigo-700 font-bold text-sm">
            {currentCount} / {maxChildren} Perfis Usados
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Existing Children */}
        {user.children?.map((child) => (
          <div key={child.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:shadow-md transition">
            <div className="relative">
                <img src={child.avatar} alt={child.name} className="w-20 h-20 rounded-full bg-slate-50 border-4 border-white shadow-sm" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-800">{child.name}</h3>
              <p className="text-slate-500 text-sm mb-1">{child.age} anos • {child.grade}</p>
              {child.school && (
                 <p className="text-slate-400 text-xs flex items-center gap-1 truncate max-w-[150px]">
                    <School className="w-3 h-3" /> {child.school}
                 </p>
              )}
              {child.city && child.state && (
                 <p className="text-slate-400 text-xs flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {child.city}, {child.state}
                 </p>
              )}
              <div className="mt-2 inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md text-xs font-bold">
                ⭐ {child.points} pontos
              </div>
            </div>
            <div className="flex flex-col gap-2">
                <button 
                onClick={() => openModal(child)}
                className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition"
                title="Editar Perfil"
                >
                <Pencil className="w-5 h-5" />
                </button>
                <button 
                onClick={() => handleRemoveChild(child.id)}
                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition"
                title="Remover Perfil"
                >
                <Trash2 className="w-5 h-5" />
                </button>
            </div>
          </div>
        ))}

        {/* Add New / Upgrade Card */}
        {canAdd ? (
            <button 
              onClick={() => openModal()}
              className="h-full min-h-[140px] border-2 border-dashed border-slate-300 rounded-3xl flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition gap-2 group"
            >
              <div className="bg-white p-3 rounded-full shadow-sm group-hover:scale-110 transition">
                 <Plus className="w-6 h-6" />
              </div>
              <span className="font-bold">Adicionar Filho</span>
            </button>
        ) : (
          <div className="h-full min-h-[140px] bg-slate-50 rounded-3xl border border-slate-200 flex flex-col items-center justify-center text-slate-500 p-6 text-center">
             <Lock className="w-8 h-8 mb-2 text-slate-400" />
             <h3 className="font-bold text-slate-700">Limite Atingido</h3>
             <p className="text-sm mb-4">O plano Básico permite apenas 1 perfil.</p>
             <button onClick={onNavigateToUpgrade} className="text-indigo-600 font-bold text-sm hover:underline">
               Fazer Upgrade para adicionar mais
             </button>
          </div>
        )}
      </div>

      {/* Edit/Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col md:flex-row my-8">
            
            {/* Avatar Studio Section */}
            <div className="bg-indigo-50 p-8 md:w-2/5 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-indigo-100 relative">
                <h3 className="text-indigo-900 font-bold font-fredoka mb-4">Estúdio de Avatar</h3>
                
                <div className="relative mb-6 group cursor-pointer" onClick={randomizeAvatar}>
                    <div className="w-32 h-32 rounded-full bg-white border-4 border-indigo-200 shadow-lg overflow-hidden">
                        <img 
                            src={`https://api.dicebear.com/7.x/${formData.avatarStyle}/svg?seed=${formData.avatarSeed}`} 
                            alt="Preview" 
                            className="w-full h-full"
                        />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition">
                        <RefreshCw className="text-white w-8 h-8" />
                    </div>
                </div>

                <div className="flex gap-2 mb-4">
                    {AVATAR_STYLES.map(style => (
                        <button
                            key={style.id}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, avatarStyle: style.id }))}
                            className={`p-2 rounded-xl transition ${formData.avatarStyle === style.id ? 'bg-indigo-600 text-white shadow-lg scale-110' : 'bg-white text-slate-400 hover:bg-indigo-100'}`}
                            title={style.name}
                        >
                            {style.icon}
                        </button>
                    ))}
                </div>

                <button 
                    type="button" 
                    onClick={randomizeAvatar}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                    <RefreshCw className="w-3 h-3" /> Sortear Novo Visual
                </button>
            </div>

            {/* Form Section */}
            <div className="p-8 md:w-3/5">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-slate-900 font-fredoka">
                        {editingId ? 'Editar Perfil' : 'Novo Aventureiro'}
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Nome</label>
                        <input 
                            type="text" 
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-slate-700"
                            placeholder="Ex: Maria"
                            required
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Idade</label>
                            <input 
                                type="number" 
                                value={formData.age}
                                onChange={e => setFormData({...formData, age: Number(e.target.value)})}
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 outline-none font-bold text-slate-700"
                                min="3" max="18"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Série Escolar</label>
                            <select 
                                value={formData.grade}
                                onChange={e => setFormData({...formData, grade: e.target.value})}
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 outline-none font-bold text-slate-700 text-sm"
                            >
                                {GRADE_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* New Fields */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Escola / Colégio</label>
                        <div className="relative">
                           <School className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                           <input 
                              type="text" 
                              value={formData.school}
                              onChange={e => setFormData({...formData, school: e.target.value})}
                              className="w-full p-3 pl-10 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 outline-none font-bold text-slate-700"
                              placeholder="Nome da escola"
                          />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Estado</label>
                          <select 
                                value={formData.state}
                                onChange={e => setFormData({...formData, state: e.target.value, city: ''})}
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 outline-none font-bold text-slate-700 text-sm"
                            >
                                <option value="">Selecione</option>
                                {statesList.map(uf => (
                                    <option key={uf.id} value={uf.sigla}>{uf.sigla}</option>
                                ))}
                          </select>
                       </div>
                       <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Cidade</label>
                          <select 
                                value={formData.city}
                                onChange={e => setFormData({...formData, city: e.target.value})}
                                disabled={!formData.state || isLoadingCities}
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 outline-none font-bold text-slate-700 text-sm disabled:opacity-50"
                            >
                                <option value="">{isLoadingCities ? 'Carregando...' : 'Selecione'}</option>
                                {citiesList.map(city => (
                                    <option key={city.id} value={city.nome}>{city.nome}</option>
                                ))}
                          </select>
                       </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button 
                            type="button" 
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
                        >
                            {editingId ? 'Salvar Alterações' : 'Criar Perfil'}
                        </button>
                    </div>
                </form>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default FamilyManager;
