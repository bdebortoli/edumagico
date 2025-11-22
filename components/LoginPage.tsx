import React, { useState, useEffect } from 'react';
import { LogIn, Mail, Lock, ArrowLeft, AlertCircle } from 'lucide-react';
import { Sparkles } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: any, token: string) => void;
  onBack: () => void;
  onShowRegister?: () => void;
}

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';

export default function LoginPage({ onLoginSuccess, onBack, onShowRegister }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Verifica conexão com servidor ao montar componente
  useEffect(() => {
    const checkServer = async () => {
      try {
        const healthUrl = API_BASE.replace('/api', '') + '/health';
        const response = await fetch(healthUrl);
        if (!response.ok) {
          setError('Servidor não está respondendo. Verifique se o backend está rodando na porta 3001.');
        }
      } catch (err) {
        // Silencioso - só mostra erro quando tentar fazer login
      }
    };
    checkServer();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validação básica
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      setLoading(false);
      return;
    }

    if (!email.includes('@')) {
      setError('Por favor, insira um email válido.');
      setLoading(false);
      return;
    }

    try {
      const loginUrl = `${API_BASE}/auth/login`;
      console.log('Tentando fazer login em:', loginUrl);
      
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      console.log('Resposta recebida:', response.status, response.statusText);

      let data;
      try {
        const text = await response.text();
        console.log('Resposta texto:', text.substring(0, 200));
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('Erro ao parsear JSON:', parseError);
        throw new Error('Erro ao processar resposta do servidor. Verifique se o servidor está rodando na porta 3001.');
      }

      if (!response.ok) {
        // Mensagens de erro mais específicas
        if (response.status === 401) {
          throw new Error('Email ou senha incorretos. Verifique suas credenciais e tente novamente.');
        } else if (response.status === 400) {
          throw new Error(data.error || 'Dados inválidos. Verifique os campos preenchidos.');
        } else if (response.status === 500) {
          throw new Error('Erro no servidor. Tente novamente em alguns instantes ou entre em contato com o suporte.');
        } else {
          throw new Error(data.error || `Erro ao fazer login (${response.status}). Tente novamente.`);
        }
      }

      // Verifica se a resposta tem os dados esperados
      if (!data.token || !data.user) {
        throw new Error('Resposta inválida do servidor. Tente novamente.');
      }

      // Armazena o token
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Chama callback de sucesso
      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      console.error('Erro no login:', err);
      
      // Mensagens de erro mais amigáveis e específicas
      if (err.name === 'TypeError' && (err.message.includes('fetch') || err.message.includes('Failed to fetch'))) {
        setError('Não foi possível conectar ao servidor backend. Verifique: 1) Se o servidor está rodando (porta 3001), 2) Se não há bloqueio de firewall, 3) Se a URL da API está correta. Tente recarregar a página.');
      } else if (err.message && err.message.includes('Credenciais inválidas')) {
        setError('Email ou senha incorretos. Verifique se digitou corretamente: Email: bdebortoli@gmail.com | Senha: admin123');
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Erro ao fazer login. Verifique suas credenciais e tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo e título */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-indigo-600 font-fredoka">EduMágico</h1>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Bem-vindo de volta!</h2>
          <p className="text-gray-600">Faça login para acessar sua conta</p>
        </div>

        {/* Card de login */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Erro */}
            {error && (
              <div className="bg-red-50 border-2 border-red-300 text-red-800 px-4 py-3 rounded-lg flex items-start gap-3 animate-fadeIn">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-sm mb-1">Erro no login</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Botão de login */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Entrando...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Entrar</span>
                </>
              )}
            </button>
          </form>

          {/* Link para voltar */}
          <div className="mt-6 text-center">
            <button
              onClick={onBack}
              className="text-sm text-gray-600 hover:text-indigo-600 transition flex items-center justify-center gap-2 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para a página inicial
            </button>
          </div>
        </div>

        {/* Informações adicionais */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Não tem uma conta?{' '}
            {onShowRegister ? (
              <button
                onClick={onShowRegister}
                className="text-indigo-600 hover:text-indigo-700 font-semibold underline"
              >
                Cadastre-se aqui
              </button>
            ) : (
              'Entre em contato com o administrador.'
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

