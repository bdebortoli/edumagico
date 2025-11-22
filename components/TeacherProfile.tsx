import React, { useState } from 'react';
import { User, BankDetails } from '../types';
import { Save, User as UserIcon, Mail, Phone, MapPin, Building2, GraduationCap, DollarSign, Calendar, FileText, Edit, X, Plus, Trash2, Loader2 } from 'lucide-react';
import { buscarCEP, formatarCEP } from '../services/cepService';
import { formatarTelefone } from '../services/phoneService';

interface TeacherProfileProps {
  user: User;
  onUpdate: (updatedUser: User) => void;
}

const SUBJECT_OPTIONS = [
  'Matemática', 'Português', 'Ciências', 'História', 'Geografia',
  'Inglês', 'Artes', 'Educação Física', 'Física', 'Química',
  'Biologia', 'Filosofia', 'Sociologia', 'Outras'
];

const TeacherProfile: React.FC<TeacherProfileProps> = ({ user, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    cpf: user.cpf || '',
    birthDate: user.birthDate ? user.birthDate.split('T')[0] : '',
    phoneNumber: user.phoneNumber || '',
    address: {
      street: user.address?.street || '',
      number: user.address?.number || '',
      complement: user.address?.complement || '',
      city: user.address?.city || '',
      state: user.address?.state || '',
      zipCode: user.address?.zipCode || ''
    },
    teacherProfile: {
      bio: user.teacherProfile?.bio || '',
      subjects: user.teacherProfile?.subjects || [],
      bankDetails: user.teacherProfile?.bankDetails || {
        bankName: '',
        accountType: 'checking' as 'checking' | 'savings',
        agency: '',
        accountNumber: '',
        pixKey: ''
      },
      totalEarnings: user.teacherProfile?.totalEarnings || 0
    }
  });

  const [newSubject, setNewSubject] = useState('');
  const [buscandoCEP, setBuscandoCEP] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);

  const handleSave = () => {
    const updatedUser: User = {
      ...user,
      name: formData.name,
      email: formData.email,
      cpf: formData.cpf,
      birthDate: formData.birthDate,
      phoneNumber: formData.phoneNumber,
      address: formData.address,
      teacherProfile: formData.teacherProfile
    };

    onUpdate(updatedUser);
    setIsEditing(false);
  };

  const handleAddSubject = () => {
    if (newSubject && !formData.teacherProfile.subjects.includes(newSubject)) {
      setFormData({
        ...formData,
        teacherProfile: {
          ...formData.teacherProfile,
          subjects: [...formData.teacherProfile.subjects, newSubject]
        }
      });
      setNewSubject('');
    }
  };

  const handleRemoveSubject = (subject: string) => {
    setFormData({
      ...formData,
      teacherProfile: {
        ...formData.teacherProfile,
        subjects: formData.teacherProfile.subjects.filter(s => s !== subject)
      }
    });
  };

  const handleCEPChange = async (cep: string) => {
    const cepFormatado = formatarCEP(cep);
    setFormData({
      ...formData,
      address: { ...formData.address, zipCode: cepFormatado }
    });

    // Busca CEP quando tiver 8 dígitos
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length === 8) {
      setBuscandoCEP(true);
      setCepError(null);
      
      try {
        const dadosCEP = await buscarCEP(cepLimpo);
        if (dadosCEP) {
          setFormData({
            ...formData,
            address: {
              ...formData.address,
              zipCode: cepFormatado,
              street: dadosCEP.logradouro,
              city: dadosCEP.localidade,
              state: dadosCEP.uf,
              // Mantém número e complemento se já existirem
            }
          });
        }
      } catch (error: any) {
        setCepError(error.message || 'Erro ao buscar CEP');
      } finally {
        setBuscandoCEP(false);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 font-fredoka">Meu Perfil</h2>
          <p className="text-slate-500">Gerencie suas informações pessoais e profissionais.</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition flex items-center gap-2"
          >
            <Edit className="w-5 h-5" /> Editar Perfil
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Informações Básicas */}
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-indigo-600" /> Informações Pessoais
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nome Completo</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-slate-700"
                />
              ) : (
                <p className="p-3 bg-slate-50 rounded-xl text-slate-700 font-bold">{user.name}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">E-mail</label>
              {isEditing ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-slate-700"
                />
              ) : (
                <p className="p-3 bg-slate-50 rounded-xl text-slate-700 font-bold flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" /> {user.email}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">CPF</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-slate-700"
                />
              ) : (
                <p className="p-3 bg-slate-50 rounded-xl text-slate-700 font-bold">{user.cpf || 'Não informado'}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Data de Nascimento</label>
              {isEditing ? (
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-slate-700"
                />
              ) : (
                <p className="p-3 bg-slate-50 rounded-xl text-slate-700 font-bold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" /> {user.birthDate ? new Date(user.birthDate).toLocaleDateString('pt-BR') : 'Não informado'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Celular</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => {
                    const telefoneFormatado = formatarTelefone(e.target.value);
                    setFormData({ ...formData, phoneNumber: telefoneFormatado });
                  }}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-slate-700"
                />
              ) : (
                <p className="p-3 bg-slate-50 rounded-xl text-slate-700 font-bold flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" /> {user.phoneNumber || 'Não informado'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Endereço */}
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-indigo-600" /> Endereço
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Rua</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.address.street}
                  onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
                  readOnly
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-700 cursor-not-allowed"
                />
              ) : (
                <p className="p-3 bg-slate-50 rounded-xl text-slate-700 font-bold">{user.address?.street || 'Não informado'}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Número</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.address.number}
                  onChange={(e) => setFormData({ ...formData, address: { ...formData.address, number: e.target.value } })}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-slate-700"
                />
              ) : (
                <p className="p-3 bg-slate-50 rounded-xl text-slate-700 font-bold">{user.address?.number || 'Não informado'}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Complemento</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.address.complement}
                  onChange={(e) => setFormData({ ...formData, address: { ...formData.address, complement: e.target.value } })}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-slate-700"
                />
              ) : (
                <p className="p-3 bg-slate-50 rounded-xl text-slate-700 font-bold">{user.address?.complement || 'Não informado'}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Cidade</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.address.city}
                  onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                  readOnly
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-700 cursor-not-allowed"
                />
              ) : (
                <p className="p-3 bg-slate-50 rounded-xl text-slate-700 font-bold">{user.address?.city || 'Não informado'}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Estado</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.address.state}
                  onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })}
                  placeholder="SP"
                  readOnly
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-700 cursor-not-allowed"
                />
              ) : (
                <p className="p-3 bg-slate-50 rounded-xl text-slate-700 font-bold">{user.address?.state || 'Não informado'}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">CEP</label>
              {isEditing ? (
                <div className="relative">
                  <input
                    type="text"
                    value={formData.address.zipCode}
                    onChange={(e) => handleCEPChange(e.target.value)}
                    placeholder="00000-000"
                    maxLength={9}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-slate-700 pr-10"
                  />
                  {buscandoCEP && (
                    <div className="absolute right-3 top-3.5">
                      <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                    </div>
                  )}
                  {cepError && (
                    <p className="text-xs text-red-500 mt-1">{cepError}</p>
                  )}
                </div>
              ) : (
                <p className="p-3 bg-slate-50 rounded-xl text-slate-700 font-bold">{user.address?.zipCode || 'Não informado'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Perfil Profissional */}
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-600" /> Perfil Profissional
          </h3>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Biografia</label>
              {isEditing ? (
                <textarea
                  value={formData.teacherProfile.bio}
                  onChange={(e) => setFormData({ ...formData, teacherProfile: { ...formData.teacherProfile, bio: e.target.value } })}
                  placeholder="Conte um pouco sobre você e sua experiência..."
                  rows={4}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-slate-700 resize-none"
                />
              ) : (
                <p className="p-3 bg-slate-50 rounded-xl text-slate-700 min-h-[100px]">{user.teacherProfile?.bio || 'Não informado'}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Matérias que Leciona</label>
              {isEditing ? (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <select
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      className="flex-1 p-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none font-bold text-slate-700"
                    >
                      <option value="">Selecione uma matéria</option>
                      {SUBJECT_OPTIONS.map(subject => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleAddSubject}
                      className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" /> Adicionar
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.teacherProfile.subjects.map((subject, index) => (
                      <span
                        key={index}
                        className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2"
                      >
                        {subject}
                        <button
                          onClick={() => handleRemoveSubject(subject)}
                          className="text-indigo-700 hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {user.teacherProfile?.subjects && user.teacherProfile.subjects.length > 0 ? (
                    user.teacherProfile.subjects.map((subject, index) => (
                      <span
                        key={index}
                        className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full font-bold text-sm"
                      >
                        {subject}
                      </span>
                    ))
                  ) : (
                    <p className="p-3 bg-slate-50 rounded-xl text-slate-500">Nenhuma matéria cadastrada</p>
                  )}
                </div>
              )}
            </div>

            {user.teacherProfile?.totalEarnings !== undefined && (
              <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span className="font-bold text-green-800">Ganhos Totais</span>
                </div>
                <p className="text-2xl font-black text-green-700">R$ {user.teacherProfile.totalEarnings.toFixed(2)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Dados Bancários */}
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" /> Dados Bancários
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nome do Banco</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.teacherProfile.bankDetails.bankName}
                  onChange={(e) => setFormData({
                    ...formData,
                    teacherProfile: {
                      ...formData.teacherProfile,
                      bankDetails: { ...formData.teacherProfile.bankDetails, bankName: e.target.value }
                    }
                  })}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-slate-700"
                />
              ) : (
                <p className="p-3 bg-slate-50 rounded-xl text-slate-700 font-bold">{user.teacherProfile?.bankDetails?.bankName || 'Não informado'}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tipo de Conta</label>
              {isEditing ? (
                <select
                  value={formData.teacherProfile.bankDetails.accountType}
                  onChange={(e) => setFormData({
                    ...formData,
                    teacherProfile: {
                      ...formData.teacherProfile,
                      bankDetails: { ...formData.teacherProfile.bankDetails, accountType: e.target.value as 'checking' | 'savings' }
                    }
                  })}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-slate-700"
                >
                  <option value="checking">Corrente</option>
                  <option value="savings">Poupança</option>
                </select>
              ) : (
                <p className="p-3 bg-slate-50 rounded-xl text-slate-700 font-bold">
                  {user.teacherProfile?.bankDetails?.accountType === 'checking' ? 'Corrente' : 'Poupança'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Agência</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.teacherProfile.bankDetails.agency}
                  onChange={(e) => setFormData({
                    ...formData,
                    teacherProfile: {
                      ...formData.teacherProfile,
                      bankDetails: { ...formData.teacherProfile.bankDetails, agency: e.target.value }
                    }
                  })}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-slate-700"
                />
              ) : (
                <p className="p-3 bg-slate-50 rounded-xl text-slate-700 font-bold">{user.teacherProfile?.bankDetails?.agency || 'Não informado'}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Número da Conta</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.teacherProfile.bankDetails.accountNumber}
                  onChange={(e) => setFormData({
                    ...formData,
                    teacherProfile: {
                      ...formData.teacherProfile,
                      bankDetails: { ...formData.teacherProfile.bankDetails, accountNumber: e.target.value }
                    }
                  })}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-slate-700"
                />
              ) : (
                <p className="p-3 bg-slate-50 rounded-xl text-slate-700 font-bold">{user.teacherProfile?.bankDetails?.accountNumber || 'Não informado'}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Chave PIX (Opcional)</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.teacherProfile.bankDetails.pixKey || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    teacherProfile: {
                      ...formData.teacherProfile,
                      bankDetails: { ...formData.teacherProfile.bankDetails, pixKey: e.target.value }
                    }
                  })}
                  placeholder="CPF, e-mail, telefone ou chave aleatória"
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-slate-700"
                />
              ) : (
                <p className="p-3 bg-slate-50 rounded-xl text-slate-700 font-bold">{user.teacherProfile?.bankDetails?.pixKey || 'Não informado'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        {isEditing && (
          <div className="flex gap-4">
            <button
              onClick={handleSave}
              className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" /> Salvar Alterações
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setFormData({
                  name: user.name || '',
                  email: user.email || '',
                  cpf: user.cpf || '',
                  birthDate: user.birthDate ? user.birthDate.split('T')[0] : '',
                  phoneNumber: user.phoneNumber || '',
                  address: {
                    street: user.address?.street || '',
                    number: user.address?.number || '',
                    complement: user.address?.complement || '',
                    city: user.address?.city || '',
                    state: user.address?.state || '',
                    zipCode: user.address?.zipCode || ''
                  },
                  teacherProfile: {
                    bio: user.teacherProfile?.bio || '',
                    subjects: user.teacherProfile?.subjects || [],
                    bankDetails: user.teacherProfile?.bankDetails || {
                      bankName: '',
                      accountType: 'checking',
                      agency: '',
                      accountNumber: '',
                      pixKey: ''
                    },
                    totalEarnings: user.teacherProfile?.totalEarnings || 0
                  }
                });
              }}
              className="px-6 py-4 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherProfile;

