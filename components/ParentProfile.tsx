import React, { useState, useEffect } from 'react';
import { User, Address, CreditCardToken } from '../types';
import { Save, User as UserIcon, Mail, Phone, MapPin, CreditCard, Calendar, FileText, X, Plus, Trash2, Edit, Loader2 } from 'lucide-react';
import { buscarCEP, formatarCEP } from '../services/cepService';
import { formatarTelefone } from '../services/phoneService';

interface ParentProfileProps {
  user: User;
  onUpdate: (updatedUser: User) => void;
}

const ParentProfile: React.FC<ParentProfileProps> = ({ user, onUpdate }) => {
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
    paymentMethods: user.parentProfile?.paymentMethods || []
  });

  const [editingCardIndex, setEditingCardIndex] = useState<number | null>(null);
  const [newCard, setNewCard] = useState<CreditCardToken | null>(null);
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
      parentProfile: {
        ...user.parentProfile,
        paymentMethods: formData.paymentMethods,
        childrenIds: user.children?.map(c => c.id) || []
      }
    };

    onUpdate(updatedUser);
    setIsEditing(false);
  };

  const handleAddCard = () => {
    setNewCard({
      last4: '',
      brand: '',
      token: ''
    });
  };

  const handleSaveCard = () => {
    if (newCard && newCard.last4 && newCard.brand) {
      setFormData({
        ...formData,
        paymentMethods: [...formData.paymentMethods, { ...newCard, token: `token_${Date.now()}` }]
      });
      setNewCard(null);
    }
  };

  const handleRemoveCard = (index: number) => {
    setFormData({
      ...formData,
      paymentMethods: formData.paymentMethods.filter((_, i) => i !== index)
    });
  };

  const getCardBrandIcon = (brand: string) => {
    const brandLower = brand.toLowerCase();
    if (brandLower.includes('visa')) return '💳';
    if (brandLower.includes('master')) return '💳';
    if (brandLower.includes('amex')) return '💳';
    return '💳';
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
          <p className="text-slate-500">Gerencie suas informações pessoais e métodos de pagamento.</p>
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

        {/* Métodos de Pagamento */}
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-600" /> Métodos de Pagamento
            </h3>
            {isEditing && (
              <button
                onClick={handleAddCard}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 transition flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" /> Adicionar Cartão
              </button>
            )}
          </div>

          {formData.paymentMethods.length === 0 && !newCard ? (
            <div className="text-center py-8 text-slate-400">
              <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum cartão cadastrado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {formData.paymentMethods.map((card, index) => (
                <div key={index} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">{getCardBrandIcon(card.brand)}</div>
                    <div>
                      <p className="font-bold text-slate-800">{card.brand}</p>
                      <p className="text-sm text-slate-500">•••• •••• •••• {card.last4}</p>
                    </div>
                  </div>
                  {isEditing && (
                    <button
                      onClick={() => handleRemoveCard(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}

              {newCard && (
                <div className="bg-indigo-50 p-4 rounded-xl border-2 border-indigo-200">
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Bandeira</label>
                      <input
                        type="text"
                        value={newCard.brand}
                        onChange={(e) => setNewCard({ ...newCard, brand: e.target.value })}
                        placeholder="Visa, Mastercard..."
                        className="w-full p-3 rounded-xl border border-indigo-200 focus:border-indigo-500 outline-none font-bold text-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Últimos 4 dígitos</label>
                      <input
                        type="text"
                        value={newCard.last4}
                        onChange={(e) => setNewCard({ ...newCard, last4: e.target.value })}
                        placeholder="1234"
                        maxLength={4}
                        className="w-full p-3 rounded-xl border border-indigo-200 focus:border-indigo-500 outline-none font-bold text-slate-700"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveCard}
                      className="flex-1 bg-indigo-600 text-white py-2 rounded-xl font-bold hover:bg-indigo-700 transition"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={() => setNewCard(null)}
                      className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
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
                  paymentMethods: user.parentProfile?.paymentMethods || []
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

export default ParentProfile;

