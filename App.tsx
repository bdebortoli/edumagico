
import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import CreatorStudio from './components/CreatorStudio';
import InteractivePlayer from './components/InteractivePlayer';
import SubscriptionPage from './components/SubscriptionPage';
import FamilyManager from './components/FamilyManager';
import PerformanceAnalytics from './components/PerformanceAnalytics';
import TeacherDashboard from './components/TeacherDashboard';
import MarketplaceModal from './components/MarketplaceModal';
import ParentProfile from './components/ParentProfile';
import TeacherProfile from './components/TeacherProfile';
import AdminDashboard from './components/AdminDashboard';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import FeedbackPage from './components/FeedbackPage';
import { User, ContentItem, ChildProfile, ActivityHistory } from './types';
import { db } from './services/database';
import { LayoutDashboard, PlusCircle, Library, LogOut, Settings, Gamepad2, BookOpen, ShoppingBag, Trophy, Sparkles, Users, CreditCard, BarChart3, Split, Filter, User as UserIcon, Search, Calendar, Bell, DollarSign, Award, Clock, Shield, Activity, Edit } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const GRADE_OPTIONS = [
  "Todos", "Pré-escola", 
  "1º Ano Fund.", "2º Ano Fund.", "3º Ano Fund.", "4º Ano Fund.", "5º Ano Fund.",
  "6º Ano Fund.", "7º Ano Fund.", "8º Ano Fund.", "9º Ano Fund.",
  "1º Ano Médio", "2º Ano Médio", "3º Ano Médio"
];

const MOCK_LEADERBOARD = [
    { id: 'c1', name: 'Pedro', points: 1250, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pedro' },
    { id: 'c2', name: 'Julia', points: 1100, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Julia' },
    { id: 'c3', name: 'Lucas', points: 950, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas' },
    { id: 'c4', name: 'Ana', points: 800, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana' },
];

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'teacher_dash' | 'create' | 'library' | 'player' | 'marketplace' | 'leaderboard' | 'subscription' | 'family' | 'analytics' | 'profile' | 'admin' | 'admin_dashboard' | 'admin_users' | 'admin_content' | 'admin_subscriptions' | 'admin_notifications' | 'admin_financial' | 'admin_rankings' | 'admin_reports' | 'admin_accesses' | 'admin_permissions' | 'feedback'>('dashboard');
  const [feedbackState, setFeedbackState] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    details?: string;
    actionLabel?: string;
    onAction?: () => void;
    secondaryActionLabel?: string;
    onSecondaryAction?: () => void;
  } | null>(null);
  
  // Estado para controlar se a aplicação está pronta
  const [isAppReady, setIsAppReady] = useState(false);
  
  // Data Source now comes from Persistence Layer
  const [contentList, setContentList] = useState<ContentItem[]>([]);
  const [marketplaceContent, setMarketplaceContent] = useState<ContentItem[]>([]); // Conteúdo do marketplace do backend
  
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [remixItem, setRemixItem] = useState<ContentItem | null>(null);
  const [marketplaceModalContent, setMarketplaceModalContent] = useState<ContentItem | null>(null);

  // Library Filter States
  const [activeChildId, setActiveChildId] = useState<string>('');
  const [filterSubject, setFilterSubject] = useState<string>('Todas');
  const [filterContentType, setFilterContentType] = useState<string>('Todas'); // Novo filtro por tipo de conteúdo
  const [filterOrigin, setFilterOrigin] = useState<string>('Todas'); // Filtro por origem: 'Todas', 'Plataforma', 'Meus'

  // Marketplace Filter States
  const [marketSubject, setMarketSubject] = useState<string>('Todos');
  const [marketGrade, setMarketGrade] = useState<string>('Todos');
  const [marketTeacher, setMarketTeacher] = useState<string>('');

  // Função para recarregar usuário completo do backend
  const reloadUserFromBackend = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        const updatedUser = data.user;
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return updatedUser;
      }
    } catch (error) {
      console.error('Erro ao recarregar usuário:', error);
    }
    return null;
  };

  // Load content from backend
  const loadContentFromBackend = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/content`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const backendContent = data.content || [];
        // Merge with local content (for backward compatibility)
        const localContent = db.getContent();
        const allContent = [...backendContent, ...localContent.filter(lc => !backendContent.find(bc => bc.id === lc.id))];
        
        // Garantir que jogo de tabuada sempre esteja presente
        const tabuadaExists = allContent.find(c => 
          c.id === '5' || 
          (c.type === 'game' && (c.data as any)?.gameType === 'multiplication-table') ||
          (c.title?.toLowerCase().includes('tabuada'))
        );
        
        if (!tabuadaExists) {
          const seedTabuada = {
            id: '5',
            title: 'Jogo da Tabuada Interativo',
            description: 'Descubra todas as multiplicações da tabuada clicando nas casas! Aprenda de forma divertida e interativa.',
            type: 'game' as const,
            authorId: 'sys',
            authorName: 'EduMágico',
            authorRole: 'teacher' as const,
            createdAt: '2023-10-15T10:00:00Z',
            subject: 'Matemática',
            ageRange: { min: 7, max: 10 },
            grade: '2º Ano Fund.',
            keywords: ['tabuada', 'multiplicação', 'matemática', 'jogo'],
            isAiGenerated: false,
            price: 0,
            salesCount: 0,
            data: {
              gameType: 'multiplication-table',
              config: {}
            }
          };
          allContent.unshift(seedTabuada); // Adiciona no início
        }
        
        setContentList(allContent);
        // Also save to local for offline access
        allContent.forEach(content => db.saveContent(content));
      }
    } catch (error) {
      console.error('Error loading content from backend:', error);
      // Fallback to local content
      const loadedContent = db.getContent();
      setContentList(loadedContent);
    }
  };

  // Load Initial Data
  useEffect(() => {
    const loadedContent = db.getContent();
    setContentList(loadedContent);
    
    // Load from backend if authenticated
    if (isAuthenticated) {
      loadContentFromBackend();
    }
    
    // Verifica se há token e usuário salvos
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsAuthenticated(true);
        
        // Recarrega usuário do backend para ter dados atualizados (incluindo children)
        reloadUserFromBackend();
        
        // Verificar hash da URL para roteamento
        try {
          const hash = window.location.hash;
          if (hash) {
            const hashParts = hash.substring(1).split('?');
            const view = hashParts[0] as any;
            const validViews = ['create', 'library', 'dashboard', 'teacher_dash', 'marketplace', 'leaderboard', 'subscription', 'family', 'analytics', 'profile', 'admin_dashboard', 'admin_users', 'admin_content', 'admin_subscriptions', 'admin_notifications', 'admin_financial', 'admin_rankings', 'admin_reports', 'admin_accesses', 'admin_permissions', 'feedback'];
            if (view && validViews.includes(view)) {
              setCurrentView(view);
            } else {
              // Redireciona baseado no role se não houver hash válido
              if (userData.role === 'admin') {
                setCurrentView('admin_dashboard');
              } else if (userData.role === 'teacher') {
                setCurrentView('teacher_dash');
              } else {
                setCurrentView('dashboard');
              }
            }
          } else {
            // Redireciona baseado no role
            if (userData.role === 'admin') {
              setCurrentView('admin_dashboard');
            } else if (userData.role === 'teacher') {
              setCurrentView('teacher_dash');
            } else {
              setCurrentView('dashboard');
            }
          }
        } catch (error) {
          console.error('Erro ao processar hash da URL:', error);
          // Fallback: redireciona baseado no role
          if (userData.role === 'admin') {
            setCurrentView('admin_dashboard');
          } else if (userData.role === 'teacher') {
            setCurrentView('teacher_dash');
          } else {
            setCurrentView('dashboard');
          }
        }
      } catch (error) {
        console.error('Erro ao carregar usuário salvo:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } else {
      // Se não autenticado, verificar se há hash para redirecionar após login
      try {
        const hash = window.location.hash;
        if (hash && hash.startsWith('#create')) {
          // Manter a intenção de ir para create após login
          // Isso será tratado após autenticação
        }
      } catch (error) {
        console.error('Erro ao verificar hash:', error);
      }
    }
    
    // Marcar aplicação como pronta após inicialização
    setIsAppReady(true);
  }, []);
  
  // Carrega marketplace do backend quando autenticado
  useEffect(() => {
    if (isAuthenticated && user && currentView === 'marketplace') {
      const loadMarketplace = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        try {
          const res = await fetch(`${API_BASE}/marketplace`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setMarketplaceContent(data.content || []);
          }
        } catch (error) {
          console.error('Error loading marketplace:', error);
        }
      };
      loadMarketplace();
    }
  }, [isAuthenticated, user, currentView]);

  // Carrega conteúdo do backend quando autenticado e na biblioteca
  useEffect(() => {
    if (isAuthenticated && user && (currentView === 'library' || currentView === 'dashboard')) {
      loadContentFromBackend();
    }
  }, [isAuthenticated, user, currentView]);

  // Initialize active child when user loads
  useEffect(() => {
    if (user?.children && user.children.length > 0 && !activeChildId) {
        setActiveChildId(user.children[0].id);
    }
  }, [user, activeChildId]);

  // Login simulado (para desenvolvimento/demo)
  const handleLogin = (role: 'parent' | 'teacher' | 'admin' = 'parent') => {
    const allUsers = db.getUsers();
    // Find the first mock user of that role for simplicity
    const loggedUser = allUsers.find(u => u.role === role) || allUsers[0];
    
    setUser(loggedUser);
    setIsAuthenticated(true);
    if (role === 'admin') {
      setCurrentView('admin_dashboard');
    } else {
      setCurrentView(role === 'teacher' ? 'teacher_dash' : 'dashboard');
    }
  };

  // Login real via API
  const handleLoginSuccess = async (userData: User, token: string) => {
    // Recarrega usuário completo do backend para garantir que children estão incluídos
    const fullUser = await reloadUserFromBackend() || userData;
    
    setUser(fullUser);
    setIsAuthenticated(true);
    setShowLogin(false);
    
    // Salva no localStorage
    localStorage.setItem('user', JSON.stringify(fullUser));
    
    // Redireciona baseado no role
    if (fullUser.role === 'admin') {
      setCurrentView('admin_dashboard');
    } else if (fullUser.role === 'teacher') {
      setCurrentView('teacher_dash');
    } else {
      setCurrentView('dashboard');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setActiveChildId('');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setShowLogin(false);
  };

  const updateUserState = (updatedUser: User) => {
      setUser(updatedUser);
      db.saveUser(updatedUser);
  };

  const handleContentCreated = async (newContent: ContentItem) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setFeedbackState({
        type: 'error',
        title: 'Autenticação Necessária',
        message: 'Você precisa estar autenticado para criar conteúdo.',
        details: 'Por favor, faça login novamente para continuar.',
        actionLabel: 'Fazer Login',
        onAction: () => {
          setFeedbackState(null);
          setIsAuthenticated(false);
          setUser(null);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setCurrentView('dashboard');
        },
        secondaryActionLabel: 'Voltar',
        onSecondaryAction: () => {
          setFeedbackState(null);
          setCurrentView(user?.role === 'teacher' ? 'teacher_dash' : 'library');
        }
      });
      setCurrentView('feedback');
      return;
    }

    try {
      // Salvar no backend
      const response = await fetch(`${API_BASE}/content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newContent.title,
          description: newContent.description,
          type: newContent.type,
          subject: newContent.subject || 'Matemática',
          ageRange: newContent.ageRange,
          grade: newContent.grade || '',
          keywords: newContent.keywords || [],
          resources: newContent.resources || {},
          price: newContent.price || 0,
          data: newContent.data,
          isAiGenerated: newContent.isAiGenerated || false
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Erro ao salvar conteúdo:', error);
        console.error('Conteúdo enviado:', {
          title: newContent.title,
          description: newContent.description,
          type: newContent.type,
          subject: newContent.subject,
          ageRange: newContent.ageRange,
          grade: newContent.grade,
          data: newContent.data ? 'presente' : 'ausente'
        });

        // Tratamento específico de erros
        let errorType: 'error' | 'warning' = 'error';
        let errorTitle = 'Erro ao Salvar Conteúdo';
        let errorMessage = error.error || 'Erro ao salvar conteúdo';
        let errorDetails = '';
        let actionLabel = 'Tentar Novamente';
        let secondaryActionLabel = 'Voltar';

        if (response.status === 400) {
          errorType = 'warning';
          errorTitle = 'Campos Obrigatórios Faltando';
          errorMessage = 'Alguns campos obrigatórios não foram preenchidos corretamente.';
          if (error.missingFields && Array.isArray(error.missingFields)) {
            errorDetails = `Campos faltando: ${error.missingFields.join(', ')}`;
          }
          actionLabel = 'Corrigir e Tentar Novamente';
        } else if (response.status === 403) {
          errorType = 'warning';
          errorTitle = 'Permissão Insuficiente';
          errorMessage = 'Você não tem permissão para criar conteúdo.';
          errorDetails = 'Apenas usuários Premium ou Professores podem criar conteúdo. Faça upgrade para continuar.';
          actionLabel = 'Fazer Upgrade';
          secondaryActionLabel = 'Voltar';
        } else if (response.status === 401) {
          errorType = 'error';
          errorTitle = 'Sessão Expirada';
          errorMessage = 'Sua sessão expirou. Por favor, faça login novamente.';
          actionLabel = 'Fazer Login';
          secondaryActionLabel = 'Voltar';
        }

        setFeedbackState({
          type: errorType,
          title: errorTitle,
          message: errorMessage,
          details: errorDetails,
          actionLabel,
          onAction: () => {
            setFeedbackState(null);
            if (response.status === 403) {
              setCurrentView('subscription');
            } else if (response.status === 401) {
              setIsAuthenticated(false);
              setUser(null);
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              setCurrentView('dashboard');
            } else {
              setCurrentView('create');
            }
          },
          secondaryActionLabel,
          onSecondaryAction: () => {
            setFeedbackState(null);
            setCurrentView(user?.role === 'teacher' ? 'teacher_dash' : 'library');
          }
        });
        setCurrentView('feedback');
        return;
      }

      const result = await response.json();
      const savedContent = result.content;

      // Atualizar lista local
      db.saveContent(savedContent);
      
      // Adicionar o conteúdo recém-criado à lista imediatamente
      setContentList(prev => {
        // Verificar se já existe para evitar duplicatas
        const exists = prev.find(c => c.id === savedContent.id);
        if (exists) {
          return prev.map(c => c.id === savedContent.id ? savedContent : c);
        }
        return [savedContent, ...prev];
      });
      
      // Recarregar conteúdo do backend para ter lista atualizada
      await loadContentFromBackend();

      // Mostrar página de sucesso
      setFeedbackState({
        type: 'success',
        title: 'Conteúdo Criado com Sucesso! 🎉',
        message: `"${newContent.title}" foi criado e salvo com sucesso!`,
        details: `Tipo: ${newContent.type === 'quiz' ? 'Quiz' : newContent.type === 'story' ? 'História' : newContent.type === 'summary' ? 'Resumo' : 'Jogo'}\nMatéria: ${newContent.subject}\nSérie: ${newContent.grade}`,
        actionLabel: 'Ver na Biblioteca',
        onAction: () => {
          setFeedbackState(null);
          setRemixItem(null);
          setCurrentView(user?.role === 'teacher' ? 'teacher_dash' : 'library');
        },
        secondaryActionLabel: 'Criar Outro',
        onSecondaryAction: () => {
          setFeedbackState(null);
          setRemixItem(null);
          setCurrentView('create');
        }
      });
      setCurrentView('feedback');
    } catch (error: any) {
      console.error('Erro ao salvar conteúdo:', error);
      
      // Verificar se é erro de conexão
      let errorMessage = error.message || 'Erro ao salvar conteúdo. Tente novamente.';
      let errorDetails = '';
      
      if (error.message?.includes('fetch') || error.message?.includes('Failed to fetch')) {
        errorMessage = 'Não foi possível conectar ao servidor.';
        errorDetails = 'Verifique sua conexão com a internet e tente novamente.';
      }

      setFeedbackState({
        type: 'error',
        title: 'Erro ao Salvar Conteúdo',
        message: errorMessage,
        details: errorDetails,
        actionLabel: 'Tentar Novamente',
        onAction: () => {
          setFeedbackState(null);
          setCurrentView('create');
        },
        secondaryActionLabel: 'Voltar',
        onSecondaryAction: () => {
          setFeedbackState(null);
          setCurrentView(user?.role === 'teacher' ? 'teacher_dash' : 'library');
        }
      });
      setCurrentView('feedback');
    }
  };

  const handleRemix = (content: ContentItem) => {
    setRemixItem(content);
    setCurrentView('create');
  };

  const handleEdit = (content: ContentItem) => {
      setRemixItem(content); // Reuse the remix logic but we will detect it's an edit via ID match in Creator
      setCurrentView('create');
  }

  const handleDelete = (id: string) => {
      // Proteger jogo de tabuada (ID '5' ou gameType 'multiplication-table')
      const content = contentList.find(c => c.id === id);
      if (content) {
        const isTabuadaGame = content.id === '5' || 
          (content.type === 'game' && (content.data as any)?.gameType === 'multiplication-table') ||
          (content.title?.toLowerCase().includes('tabuada'));
        
        if (isTabuadaGame) {
          alert('O jogo de tabuada é fixo e não pode ser removido.');
          return;
        }
      }

      if(confirm("Tem certeza?")) {
          db.deleteContent(id);
          setContentList(db.getContent());
      }
  }

  const handleEditTitle = async (contentId: string, newTitle: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Você precisa estar autenticado para editar o título.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/content/${contentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: newTitle })
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Erro ao editar título: ${error.error || 'Erro desconhecido'}`);
        return;
      }

      const result = await response.json();
      const updatedContent = result.content;

      // Atualizar lista local
      setContentList(prev => prev.map(c => c.id === contentId ? updatedContent : c));
      db.saveContent(updatedContent);

      // Se o conteúdo selecionado for o mesmo, atualizar também
      if (selectedContent && selectedContent.id === contentId) {
        setSelectedContent(updatedContent);
      }
    } catch (error: any) {
      console.error('Erro ao editar título:', error);
      alert('Erro ao editar título. Tente novamente.');
    }
  };

  const handlePlayContent = (content: ContentItem) => {
    // Check ownership
    const isOwner = content.authorId === user?.id;
    const isFree = content.price === 0;
    const hasPurchased = false; // Simplified for demo, normally check purchase history
    // In this simple model, if it's in the list it is usually accessible, BUT marketplace logic separates owned vs unowned
    // For now, if it's paid and not author, we show marketplace modal
    
    if (!isOwner && !isFree && !hasPurchased) {
         setMarketplaceModalContent(content);
         return;
    }

    setSelectedContent(content);
    setCurrentView('player');
  };

  const handleBuyContent = async (content: ContentItem) => {
      if (!user) return;
      
      const token = localStorage.getItem('token') || '';
      
      try {
        const res = await fetch(`${API_BASE}/marketplace/${content.id}/purchase`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) {
          const error = await res.json();
          alert(error.error || 'Erro ao realizar compra');
          return;
        }

        const data = await res.json();
        
        // Atualiza a lista de conteúdo local
        setContentList(prev => [...prev, data.content]);
        
        // Atualiza o usuário com as novas moedas
        if (user) {
          const updatedUser = { ...user, coins: user.coins - content.price };
          updateUserState(updatedUser);
        }
        
        // Fecha o modal
        setMarketplaceModalContent(null);
        
        // Redireciona para a biblioteca
        alert("Compra realizada com sucesso! O item foi adicionado à sua biblioteca.");
        setCurrentView('library');
      } catch (error) {
        console.error('Error purchasing content:', error);
        alert('Erro ao realizar compra. Tente novamente.');
      }
  };

  const handleActivityComplete = async (pointsEarned: number) => {
    if (!user || !selectedContent) return;
    
    const token = localStorage.getItem('token') || '';
    const childId = activeChildId || user.children?.[0]?.id;
    
    if (!childId) {
      console.error('No child selected');
      return;
    }

    try {
      // Salva o histórico no banco
      const res = await fetch(`${API_BASE}/analytics/activity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          childId: childId,
          contentId: selectedContent.id,
          score: pointsEarned,
          maxScore: 100
        })
      });

      if (!res.ok) {
        const error = await res.json();
        console.error('Error saving activity:', error);
        return;
      }

      const data = await res.json();
      
      // Atualiza os pontos do filho localmente
      let updatedChildren = user.children || [];
      updatedChildren = updatedChildren.map(c => {
        if (c.id === childId) {
          return { ...c, points: c.points + data.pointsEarned };
        }
        return c;
      });

      const updatedUser = { 
        ...user, 
        children: updatedChildren
      };
      updateUserState(updatedUser);
    } catch (error) {
      console.error('Error completing activity:', error);
    }
  };

  const handleUpgrade = async (plan: 'basic'|'premium', cycle: 'monthly'|'yearly') => {
    if (!user) return;
    
    // Busca o usuário atualizado do backend para garantir que está sincronizado
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          updateUserState(data.user);
          return;
        }
      }
    } catch (error) {
      console.error('Error fetching updated user:', error);
    }
    
    // Fallback: atualiza localmente se não conseguir buscar do backend
    const updated = {
        ...user,
        plan: plan,
        subscription: {
            status: 'active',
            cycle: cycle,
            nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            last4Digits: '4242'
        }
    };
    updateUserState(updated as User);
  };

  const handleUpdateChildren = async (newChildren: ChildProfile[]) => {
    if (!user) return;
    
    // Atualiza estado local imediatamente
    const updated = { ...user, children: newChildren };
    setUser(updated);
    
    // Atualiza localStorage
    localStorage.setItem('user', JSON.stringify(updated));
    
    // Recarrega usuário completo do backend para garantir sincronização
    await reloadUserFromBackend();
    
    if (activeChildId && !newChildren.find(c => c.id === activeChildId)) {
        setActiveChildId(newChildren.length > 0 ? newChildren[0].id : '');
    }
  };

  // Helper function to get available subjects based on education level
  const getAvailableSubjects = (educationLevel?: string): string[] => {
    if (!educationLevel) {
      // Se não tiver educationLevel, retorna todas as matérias
      return ['Matemática', 'Ciências', 'Português', 'Geografia', 'História', 'Inglês', 'Física', 'Química', 'Biologia', 'Filosofia', 'Arte', 'Espanhol', 'Psicomotricidade', 'Redação'];
    }

    switch (educationLevel) {
      case 'fundamental1':
      case 'fundamental2':
        // Fundamental 1 e 2: Matemática, Ciências, Português, Geografia, História, Inglês
        return ['Matemática', 'Ciências', 'Português', 'Geografia', 'História', 'Inglês'];
      case 'ensino-medio':
        // Ensino Médio: Matemática, Física, Química, Biologia, Português, Geografia, História, Inglês e Espanhol
        return ['Matemática', 'Física', 'Química', 'Biologia', 'Português', 'Geografia', 'História', 'Inglês', 'Espanhol'];
      case 'pre-escola':
        // Pré-escola: matérias mais básicas
        return ['Matemática', 'Português', 'Arte', 'Psicomotricidade'];
      default:
        return ['Matemática', 'Ciências', 'Português', 'Geografia', 'História', 'Inglês'];
    }
  };

  // --- Filter Logic ---
  const getFilteredContent = () => {
    // Garantir que jogo de tabuada sempre esteja presente
    const tabuadaGame = contentList.find(c => 
      c.id === '5' || 
      (c.type === 'game' && (c.data as any)?.gameType === 'multiplication-table') ||
      (c.title?.toLowerCase().includes('tabuada'))
    );
    
    // Se não encontrar, adicionar do seed
    if (!tabuadaGame) {
      const seedTabuada = {
        id: '5',
        title: 'Jogo da Tabuada Interativo',
        description: 'Descubra todas as multiplicações da tabuada clicando nas casas! Aprenda de forma divertida e interativa.',
        type: 'game' as const,
        authorId: 'sys',
        authorName: 'EduMágico',
        authorRole: 'teacher' as const,
        createdAt: '2023-10-15T10:00:00Z',
        subject: 'Matemática',
        ageRange: { min: 7, max: 10 },
        grade: '2º Ano Fund.',
        keywords: ['tabuada', 'multiplicação', 'matemática', 'jogo'],
        isAiGenerated: false,
        price: 0,
        salesCount: 0,
        data: {
          gameType: 'multiplication-table',
          config: {}
        }
      };
      contentList.push(seedTabuada);
      db.saveContent(seedTabuada);
    }

    return contentList.filter(item => {
        // Logic: Show items that are (Owned by me OR Free) AND NOT (Paid items by others unless purchased copy exists)
        // In our simple DB, purchased items are cloned with my ID.
        // So "My Library" = items where authorId is ME (created or bought) OR items that are FREE system items.
        
        // Comparar IDs como strings para evitar problemas de tipo
        const isMyContent = String(item.authorId) === String(user?.id);
        const isSystemContent = String(item.authorId) === 'sys';
        
        if (!isMyContent && !isSystemContent) return false;

        // Filtro por origem
        if (filterOrigin === 'Plataforma' && !isSystemContent) return false;
        if (filterOrigin === 'Meus' && !isMyContent) return false;

        // Exceção: Jogo da Tabuada sempre aparece para todos os alunos
        const isTabuadaGame = item.id === '5' || 
          (item.type === 'game' && (item.data as any)?.gameType === 'multiplication-table') ||
          (item.title?.toLowerCase().includes('tabuada'));

        // Filtro por matéria (exceto jogo da tabuada)
        if (!isTabuadaGame && filterSubject !== 'Todas' && item.subject !== filterSubject) return false;

        // Filtro por tipo de conteúdo
        if (filterContentType !== 'Todas' && item.type !== filterContentType) return false;

        // Filtrar matérias baseado no educationLevel do aluno selecionado (exceto jogo da tabuada)
        if (activeChildId && user?.children && !isTabuadaGame) {
          const activeChild = user.children.find(c => c.id === activeChildId);
          if (activeChild && activeChild.educationLevel) {
            const availableSubjects = getAvailableSubjects(activeChild.educationLevel);
            if (!availableSubjects.includes(item.subject)) return false;
          }
        }
        
        if (activeChildId && user?.children && !isTabuadaGame) {
            const activeChild = user.children.find(c => c.id === activeChildId);
            if (activeChild) {
                // Verifica série: conteúdo deve ser da série do aluno
                if (item.grade && activeChild.grade !== item.grade) return false;
                
                // Verifica idade: idade do aluno deve estar dentro do range (com buffer de 1 ano)
                const childAge = activeChild.birthDate 
                  ? (() => {
                      const birth = new Date(activeChild.birthDate);
                      const today = new Date();
                      let age = today.getFullYear() - birth.getFullYear();
                      const monthDiff = today.getMonth() - birth.getMonth();
                      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                        age--;
                      }
                      return age;
                    })()
                  : activeChild.age;
                
                if (childAge !== undefined && childAge !== null) {
                  const min = item.ageRange.min - 1;
                  const max = item.ageRange.max + 1;
                  if (childAge < min || childAge > max) return false;
                }
            }
        }
        return true;
    });
  };

  const getMarketplaceContent = () => {
      // Usa conteúdo do backend (marketplaceContent) se disponível, senão usa contentList
      const source = marketplaceContent.length > 0 ? marketplaceContent : contentList;
      
      return source.filter(c => {
          if (c.price <= 0) return false; // Only paid/store items
          if (c.authorId === user?.id) return false; // Don't buy my own content
          
          if (marketSubject !== 'Todos' && c.subject !== marketSubject) return false;
          if (marketGrade !== 'Todos' && c.grade !== marketGrade) return false;
          if (marketTeacher && !c.authorName.toLowerCase().includes(marketTeacher.toLowerCase())) return false;

          return true;
      });
  }
  
  // Carrega marketplace quando o usuário acessa a view
  useEffect(() => {
    if (isAuthenticated && user && currentView === 'marketplace') {
      const loadMarketplace = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        try {
          const res = await fetch(`${API_BASE}/marketplace`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setMarketplaceContent(data.content || []);
          }
        } catch (error) {
          console.error('Error loading marketplace:', error);
        }
      };
      loadMarketplace();
    }
  }, [isAuthenticated, user, currentView]);

  // Get available subjects based on active child's education level
  const getFilteredSubjects = (): string[] => {
    let subjects: string[] = [];
    
    if (activeChildId && user?.children) {
      const activeChild = user.children.find(c => c.id === activeChildId);
      if (activeChild && activeChild.educationLevel) {
        // Retorna apenas as matérias permitidas para o nível de ensino do aluno selecionado
        const availableSubjects = getAvailableSubjects(activeChild.educationLevel);
        subjects = availableSubjects;
      }
    } else if (user?.children && user.children.length > 0) {
      // Se não houver aluno selecionado, usa o primeiro aluno se existir
      const firstChild = user.children[0];
      if (firstChild.educationLevel) {
        const availableSubjects = getAvailableSubjects(firstChild.educationLevel);
        subjects = availableSubjects;
      }
    } else {
      // Fallback: retorna matérias padrão do fundamental (caso não tenha aluno ou educationLevel)
      subjects = ['Matemática', 'Ciências', 'Português', 'Geografia', 'História', 'Inglês'];
    }
    
    // Ordena as matérias (exceto "Todas") e coloca "Todas" no início
    const sortedSubjects = subjects.sort();
    return ['Todas', ...sortedSubjects];
  };

  const uniqueSubjects = getFilteredSubjects();

  // Aguardar inicialização antes de renderizar
  if (!isAppReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-bold">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (showRegister) {
      return <RegisterPage onRegisterSuccess={handleLoginSuccess} onBack={() => { setShowRegister(false); setShowLogin(true); }} />;
    }
    if (showLogin) {
      return <LoginPage onLoginSuccess={handleLoginSuccess} onBack={() => setShowLogin(false)} onShowRegister={() => { setShowLogin(false); setShowRegister(true); }} />;
    }
    return <LandingPage onLogin={handleLogin} onShowLogin={() => setShowLogin(true)} onShowRegister={() => { setShowLogin(false); setShowRegister(true); }} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-nunito">
      
      {/* Sidebar Navigation */}
      <aside className="bg-white border-r border-slate-200 w-full md:w-64 flex-shrink-0 flex flex-col z-20 shadow-sm">
        <div className="p-6 flex items-center gap-2 font-bold text-2xl text-indigo-600 font-fredoka border-b border-slate-100">
          <Sparkles className="w-6 h-6" /> EduMágico
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-6 mb-6">
             <div className="bg-indigo-50 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-indigo-100 transition" onClick={() => setCurrentView('profile')}>
                 <div className="bg-white p-2 rounded-lg shadow-sm">
                    <img src={`https://ui-avatars.com/api/?name=${user?.name}&background=random`} alt="User" className="w-8 h-8 rounded-full" />
                 </div>
                 <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{user?.name}</p>
                    <div className="flex items-center gap-1 text-xs">
                        <span className={`font-medium ${
                            user?.role === 'admin' ? 'text-red-600' : 
                            user?.role === 'teacher' ? 'text-indigo-600' : 
                            'text-slate-500'
                        }`}>
                            {user?.role === 'admin' ? 'Administrador' : 
                             user?.role === 'teacher' ? 'Professor' : 
                             'Responsável'}
                        </span>
                    </div>
                 </div>
             </div>
             {user?.role === 'parent' && (
                 <button onClick={() => { handleLogout(); handleLogin('teacher'); }} className="mt-2 text-xs text-indigo-500 hover:underline w-full text-left">
                     Alternar para modo Professor (Demo)
                 </button>
             )}
          </div>

          <nav className="px-4 space-y-1">
            {user?.role === 'admin' ? (
                <>
                    <NavButton active={currentView === 'admin_dashboard'} onClick={() => setCurrentView('admin_dashboard')} icon={<LayoutDashboard size={20} />} label="Dashboard" />
                    <NavButton active={currentView === 'admin_users'} onClick={() => setCurrentView('admin_users')} icon={<Users size={20} />} label="Usuários" />
                    <NavButton active={currentView === 'admin_content'} onClick={() => setCurrentView('admin_content')} icon={<BookOpen size={20} />} label="Conteúdos" />
                    <NavButton active={currentView === 'admin_subscriptions'} onClick={() => setCurrentView('admin_subscriptions')} icon={<CreditCard size={20} />} label="Assinaturas" />
                    <NavButton active={currentView === 'admin_notifications'} onClick={() => setCurrentView('admin_notifications')} icon={<Bell size={20} />} label="Notificações" />
                    <NavButton active={currentView === 'admin_financial'} onClick={() => setCurrentView('admin_financial')} icon={<DollarSign size={20} />} label="Financeiro" />
                    <NavButton active={currentView === 'admin_rankings'} onClick={() => setCurrentView('admin_rankings')} icon={<Award size={20} />} label="Rankings" />
                    <NavButton active={currentView === 'admin_reports'} onClick={() => setCurrentView('admin_reports')} icon={<BarChart3 size={20} />} label="Relatórios" />
                    <NavButton active={currentView === 'admin_accesses'} onClick={() => setCurrentView('admin_accesses')} icon={<Activity size={20} />} label="Acessos" />
                    <NavButton active={currentView === 'admin_permissions'} onClick={() => setCurrentView('admin_permissions')} icon={<Settings size={20} />} label="Permissões" />
                </>
            ) : user?.role === 'teacher' ? (
                <>
                    <NavButton active={currentView === 'teacher_dash'} onClick={() => setCurrentView('teacher_dash')} icon={<LayoutDashboard size={20} />} label="Painel do Educador" />
                    <NavButton active={currentView === 'marketplace'} onClick={() => setCurrentView('marketplace')} icon={<ShoppingBag size={20} />} label="Loja de Recursos" />
                    <NavButton active={currentView === 'create'} onClick={() => { setRemixItem(null); setCurrentView('create'); }} icon={<PlusCircle size={20} />} label="Criar Atividade" />
                </>
            ) : (
                <>
                    <NavButton active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} icon={<LayoutDashboard size={20} />} label="Início" />
                    <NavButton active={currentView === 'library'} onClick={() => setCurrentView('library')} icon={<Library size={20} />} label="Minhas Atividades" />
                    <NavButton active={currentView === 'create'} onClick={() => { setRemixItem(null); setCurrentView('create'); }} icon={<PlusCircle size={20} />} label="Criar Mágica" />
                    <NavButton active={currentView === 'marketplace'} onClick={() => setCurrentView('marketplace')} icon={<ShoppingBag size={20} />} label="Loja Oficial" />
                </>
            )}
            
            {user?.role === 'parent' && (
                <>
                    <div className="pt-4 pb-2 px-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Meus Filhos</p>
                    </div>
                    <NavButton active={currentView === 'family'} onClick={() => setCurrentView('family')} icon={<Users size={20} />} label="Gerenciar Família" />
                    <NavButton active={currentView === 'analytics'} onClick={() => setCurrentView('analytics')} icon={<BarChart3 size={20} />} label="Desempenho" />
                </>
            )}

            {user?.role !== 'admin' && (
                <>
                    <NavButton active={currentView === 'leaderboard'} onClick={() => setCurrentView('leaderboard')} icon={<Trophy size={20} />} label="Ranking Global" />

                    <div className="pt-4 pb-2 px-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Conta</p>
                    </div>
                    <NavButton active={currentView === 'profile'} onClick={() => setCurrentView('profile')} icon={<UserIcon size={20} />} label="Meu Perfil" />
                    <NavButton active={currentView === 'subscription'} onClick={() => setCurrentView('subscription')} icon={<CreditCard size={20} />} label="Assinatura" />
                </>
            )}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-100">
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-500 hover:bg-red-50 hover:text-red-500 rounded-xl transition font-bold">
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto h-screen bg-slate-50 p-6 md:p-8">
        
        <div className="max-w-5xl mx-auto mb-8">
           {currentView === 'player' ? null : !currentView.startsWith('admin_') && (
             <header className="flex justify-between items-center">
                <h1 className="text-3xl font-black text-slate-800 font-fredoka capitalize tracking-tight">
                  {currentView === 'dashboard' && `Olá, ${user?.name?.split(' ')[0] || 'Usuário'}! 👋`}
                  {currentView === 'teacher_dash' && `Sala dos Professores`}
                  {currentView === 'library' && 'Sua Biblioteca'}
                  {currentView === 'create' && (remixItem && user?.role === 'teacher' ? 'Editor de Conteúdo' : remixItem ? 'Estúdio de Remix' : 'Estúdio de Criação')}
                  {currentView === 'marketplace' && 'Loja de Atividades'}
                  {currentView === 'leaderboard' && 'Quadro de Líderes'}
                  {currentView === 'profile' && 'Meu Perfil'}
                  {currentView === 'subscription' && 'Sua Assinatura'}
                </h1>
             </header>
           )}
        </div>

        <div className="max-w-5xl mx-auto pb-12">
          
          {currentView === 'dashboard' && user?.role === 'parent' && (
            <div className="space-y-8 animate-fade-in">
              {/* Hero Section with Image */}
              <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-slate-100">
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="p-8 md:p-12 flex flex-col justify-center">
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 font-fredoka mb-4 leading-tight">
                      Aprendizado que conecta famílias
                    </h2>
                    <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                      Transforme cada momento de estudo em uma experiência especial. Crie atividades personalizadas com IA e acompanhe o progresso do seu filho de perto.
                    </p>
                    <button 
                      onClick={() => { setRemixItem(null); setCurrentView('create'); }}
                      className="self-start bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg hover:scale-105 transform flex items-center gap-2"
                    >
                      <Sparkles className="w-5 h-5" />
                      Criar Primeira Atividade
                    </button>
                  </div>
                  <div className="relative h-64 md:h-auto min-h-[300px] bg-slate-100 overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=2022&auto=format&fit=crop&ixlib=rb-4.0.3" 
                      alt="Mãe e filho estudando juntos em uma mesa, aprendendo com tablet e caderno" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback se a imagem não carregar
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?q=80&w=2040&auto=format&fit=crop';
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Dashboard Content (Same as before) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DashboardCard title="Pontos Totais" value={user?.children?.[0]?.points || 0} icon={<Trophy className="text-yellow-500" />} color="bg-yellow-50 text-yellow-700" />
                <DashboardCard title="Atividades" value={contentList.filter(c => c.authorId === user?.id).length} icon={<Library className="text-blue-500" />} color="bg-blue-50 text-blue-700" />
                <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-6 rounded-3xl shadow-xl text-white relative overflow-hidden cursor-pointer group" onClick={() => { setRemixItem(null); setCurrentView('create'); }}>
                  <div className="relative z-10">
                     <p className="font-bold text-indigo-200 mb-1 text-sm uppercase tracking-wide">Nova Atividade</p>
                     <p className="text-2xl font-black flex items-center gap-2">Criar com IA <PlusCircle className="w-6 h-6" /></p>
                  </div>
                  <Sparkles className="absolute -bottom-4 -right-4 w-32 h-32 text-white opacity-10 group-hover:scale-110 transition duration-500" />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-end mb-4">
                  <h2 className="text-xl font-bold text-slate-800 font-fredoka">Continuar Aprendendo</h2>
                  <button onClick={() => setCurrentView('library')} className="text-indigo-600 font-bold text-sm hover:underline">Ver biblioteca</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getFilteredContent().slice(0, 3).map(content => (
                    <ContentCard 
                      key={content.id} 
                      content={content} 
                      onClick={() => handlePlayContent(content)} 
                      onRemix={() => handleRemix(content)}
                      onEditTitle={(newTitle) => handleEditTitle(content.id, newTitle)}
                      currentUserId={user?.id}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentView === 'teacher_dash' && user && (
              <TeacherDashboard 
                user={user} 
                myContent={contentList.filter(c => c.authorId === user.id)} 
                onCreateNew={() => { setRemixItem(null); setCurrentView('create'); }}
                onEditContent={handleEdit}
                onDeleteContent={handleDelete}
              />
          )}

          {currentView === 'feedback' && feedbackState && (
            <FeedbackPage
              type={feedbackState.type}
              title={feedbackState.title}
              message={feedbackState.message}
              details={feedbackState.details}
              actionLabel={feedbackState.actionLabel}
              onAction={feedbackState.onAction}
              secondaryActionLabel={feedbackState.secondaryActionLabel}
              onSecondaryAction={feedbackState.onSecondaryAction}
              showHomeButton={true}
              onHome={() => {
                setFeedbackState(null);
                setCurrentView(user?.role === 'teacher' ? 'teacher_dash' : user?.role === 'admin' ? 'admin_dashboard' : 'dashboard');
              }}
            />
          )}

          {currentView === 'create' && (
            <CreatorStudio 
                onContentCreated={handleContentCreated} 
                userPlan={user?.plan || 'basic'} 
                userRole={user?.role || 'parent'} 
                initialSource={remixItem}
                onCancelRemix={() => { setRemixItem(null); setCurrentView(user?.role === 'teacher' ? 'teacher_dash' : 'library'); }}
                children={user?.children || []}
                onNavigateToSubscription={() => setCurrentView('subscription')}
                onNavigateToFamily={() => setCurrentView('family')}
                hasCreatedContent={user ? (() => {
                  // Verificar conteúdo criado pelo usuário
                  // Pode ser que authorId seja string ou número, então vamos comparar ambos
                  const userContent = contentList.filter(c => {
                    const authorIdMatch = String(c.authorId) === String(user.id) || c.authorId === user.id;
                    const roleMatch = c.authorRole === user.role;
                    return authorIdMatch && roleMatch;
                  });
                  
                  // Também verificar no backend se houver token
                  const token = localStorage.getItem('token');
                  if (token && userContent.length === 0) {
                    // Se não encontrou no contentList local, pode estar apenas no backend
                    // Por enquanto, vamos confiar no contentList
                    console.log('Conteúdo não encontrado localmente, mas pode existir no backend');
                  }
                  
                  console.log('Verificando conteúdo criado:', {
                    userId: user.id,
                    userRole: user.role,
                    contentCount: userContent.length,
                    contentIds: userContent.map(c => c.id),
                    allContentIds: contentList.map(c => ({ id: c.id, authorId: c.authorId, authorRole: c.authorRole }))
                  });
                  
                  return userContent.length > 0;
                })() : false}
            />
          )}

          {currentView === 'library' && (
            <div className="space-y-6 animate-fade-in">
              {/* Filter Header */}
              <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                {user?.children && user.children.length > 0 && (
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Perfil do Aluno</p>
                        <div className="flex gap-3 overflow-x-auto pb-2">
                            {user.children.map(child => (
                                <button 
                                    key={child.id}
                                    onClick={() => setActiveChildId(child.id)}
                                    className={`flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full border-2 transition-all whitespace-nowrap ${activeChildId === child.id ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 bg-white hover:border-indigo-300'}`}
                                >
                                    <img src={child.avatar} alt={child.name} className="w-8 h-8 rounded-full bg-white" />
                                    <div className="text-left">
                                        <p className={`text-sm font-bold leading-tight ${activeChildId === child.id ? 'text-indigo-700' : 'text-slate-600'}`}>{child.name}</p>
                                        <p className="text-[10px] text-slate-400 leading-tight">{child.grade}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Origem</p>
                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                        {['Todas', 'Plataforma', 'Meus'].map(origin => (
                            <button 
                                key={origin} 
                                onClick={() => setFilterOrigin(origin)} 
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition whitespace-nowrap ${
                                    filterOrigin === origin 
                                        ? 'bg-indigo-600 text-white shadow-md' 
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                            >
                                {origin}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tipo de Conteúdo</p>
                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                        {['Todas', 'story', 'quiz', 'summary', 'game'].map(type => (
                            <button 
                                key={type} 
                                onClick={() => setFilterContentType(type)} 
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition whitespace-nowrap ${
                                    filterContentType === type 
                                        ? 'bg-indigo-600 text-white shadow-md' 
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                            >
                                {type === 'Todas' ? 'Todas' : 
                                 type === 'story' ? 'História' :
                                 type === 'quiz' ? 'Quiz' :
                                 type === 'summary' ? 'Resumo' :
                                 type === 'game' ? 'Jogo' : type}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Matéria</p>
                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                        {uniqueSubjects.map(subject => (
                            <button key={subject} onClick={() => setFilterSubject(subject)} className={`px-4 py-2 rounded-lg text-sm font-bold transition whitespace-nowrap ${filterSubject === subject ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                {subject}
                            </button>
                        ))}
                    </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFilteredContent().length > 0 ? (
                    getFilteredContent().map(content => (
                        <ContentCard 
                          key={content.id} 
                          content={content} 
                          onClick={() => handlePlayContent(content)} 
                          onRemix={() => handleRemix(content)}
                          onEditTitle={(newTitle) => handleEditTitle(content.id, newTitle)}
                          currentUserId={user?.id}
                        />
                    ))
                ) : (
                    <div className="col-span-full text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                        <p className="text-slate-500 font-bold">Nenhuma atividade encontrada</p>
                        <button onClick={() => { setRemixItem(null); setCurrentView('create'); }} className="mt-4 text-indigo-600 font-bold text-sm hover:underline">Criar nova atividade</button>
                    </div>
                )}
              </div>
            </div>
          )}

          {currentView === 'marketplace' && (
            <div className="animate-fade-in">
                <div className="bg-purple-100 rounded-3xl p-8 mb-8 flex items-center justify-between relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-2xl font-bold text-purple-900 font-fredoka mb-2">Conteúdos Premium</h2>
                        <p className="text-purple-700 max-w-md">Materiais criados por professores especialistas para turbinar o aprendizado.</p>
                    </div>
                    <div className="hidden md:block text-purple-900 font-bold text-4xl opacity-20 absolute right-8 rotate-12">LOJA</div>
                </div>

                {/* Marketplace Filters */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm mb-8">
                    <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Filter className="w-4 h-4"/> Filtros Avançados</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Matéria</label>
                            <select value={marketSubject} onChange={(e) => setMarketSubject(e.target.value)} className="w-full p-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-600 outline-none bg-white">
                                {uniqueSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Série</label>
                            <select value={marketGrade} onChange={(e) => setMarketGrade(e.target.value)} className="w-full p-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-600 outline-none bg-white">
                                {GRADE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Professor</label>
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 w-4 h-4 text-slate-300" />
                                <input 
                                    type="text" 
                                    placeholder="Buscar Professor..."
                                    value={marketTeacher} 
                                    onChange={(e) => setMarketTeacher(e.target.value)} 
                                    className="w-full pl-8 p-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-600 outline-none bg-white"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getMarketplaceContent().map(content => (
                        <ContentCard key={content.id} content={content} onClick={() => setMarketplaceModalContent(content)} showPrice />
                    ))}
                    {getMarketplaceContent().length === 0 && (
                         <div className="col-span-full text-center text-slate-400 italic py-8">Nenhum material encontrado com esses filtros.</div>
                    )}
                </div>
            </div>
          )}

          {/* Other views (Leaderboard, Player, Subscription, Family, Analytics) remain same */}
          {currentView === 'leaderboard' && (
             <div className="max-w-2xl mx-auto animate-fade-in">
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
                    <div className="bg-indigo-600 p-8 text-center text-white">
                        <Trophy className="w-16 h-16 mx-auto mb-2 text-yellow-300" />
                        <h2 className="text-2xl font-bold font-fredoka">Ranking Semanal</h2>
                        <p className="text-indigo-200">Quem está aprendendo mais?</p>
                    </div>
                    <div className="p-4">
                        {MOCK_LEADERBOARD.sort((a,b) => b.points - a.points).map((student, index) => (
                            <div key={student.id} className={`flex items-center gap-4 p-4 rounded-xl mb-2 ${index === 0 ? 'bg-yellow-50 border border-yellow-100' : 'bg-white hover:bg-slate-50'}`}>
                                <div className={`font-black text-lg w-8 text-center ${index === 0 ? 'text-yellow-600' : 'text-slate-400'}`}>#{index + 1}</div>
                                <img src={student.avatar} className="w-12 h-12 rounded-full bg-white shadow-sm" alt={student.name} />
                                <div className="flex-1">
                                    <p className="font-bold text-slate-800">{student.name}</p>
                                    <p className="text-xs text-slate-500">Aluno Nota 10</p>
                                </div>
                                <div className="font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{student.points} pts</div>
                            </div>
                        ))}
                    </div>
                </div>
             </div>
          )}
          {currentView === 'player' && selectedContent && (
            <InteractivePlayer 
              content={selectedContent} 
              onBack={() => setCurrentView('library')} 
              onComplete={handleActivityComplete}
              onContentUpdated={(updatedContent) => {
                // Update content in the list
                db.saveContent(updatedContent);
                const updatedList = db.getContent();
                setContentList(updatedList);
                // Update selected content
                setSelectedContent(updatedContent);
              }}
              userRole={user?.role}
            />
          )}
            {currentView.startsWith('admin_') && (
              <AdminDashboard 
                currentView={currentView.replace('admin_', '')} 
                onViewChange={(view) => setCurrentView(`admin_${view}`)} 
              />
            )}
          {currentView === 'profile' && user && (
            user.role === 'parent' ? (
              <ParentProfile user={user} onUpdate={updateUserState} />
            ) : (
              <TeacherProfile user={user} onUpdate={updateUserState} />
            )
          )}
          {currentView === 'subscription' && user && <SubscriptionPage currentUser={user} onUpgrade={handleUpgrade} />}
          {currentView === 'family' && user && <FamilyManager user={user} onUpdateChildren={handleUpdateChildren} onNavigateToUpgrade={() => setCurrentView('subscription')} />}
          {currentView === 'analytics' && user && <PerformanceAnalytics user={user} />}

        </div>
      </main>

      {/* Marketplace Modal */}
      {marketplaceModalContent && user && (
          <MarketplaceModal 
             content={marketplaceModalContent} 
             user={user} 
             onClose={() => setMarketplaceModalContent(null)} 
             onBuy={handleBuyContent} 
          />
      )}

    </div>
  );
}

// --- Helper Components ---
const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition duration-200 ${active ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
    {icon} <span>{label}</span>
  </button>
);

const DashboardCard = ({ title, value, icon, color }: { title: string, value: number, icon: React.ReactNode, color: string }) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>{icon}</div>
    <div><p className="text-slate-400 font-bold text-xs uppercase tracking-wider">{title}</p><p className="text-2xl font-black text-slate-800">{value}</p></div>
  </div>
);

const ContentCard: React.FC<{ 
  content: ContentItem, 
  onClick: () => void, 
  showPrice?: boolean, 
  onRemix?: () => void,
  onEditTitle?: (newTitle: string) => void,
  currentUserId?: string
}> = ({ content, onClick, showPrice, onRemix, onEditTitle, currentUserId }) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(content.title);
  const isMyContent = String(content.authorId) === String(currentUserId);
  const getIcon = () => {
    switch (content.type) {
      case 'story': return <BookOpen className="w-5 h-5 text-orange-500" />;
      case 'quiz': return <Gamepad2 className="w-5 h-5 text-indigo-500" />;
      case 'summary': return <Library className="w-5 h-5 text-emerald-500" />;
      case 'game': return <Gamepad2 className="w-5 h-5 text-purple-500" />;
    }
  };

  const getColor = () => {
    switch (content.type) {
      case 'story': return 'bg-orange-50 text-orange-700';
      case 'quiz': return 'bg-indigo-50 text-indigo-700';
      case 'summary': return 'bg-emerald-50 text-emerald-700';
      case 'game': return 'bg-purple-50 text-purple-700';
    }
  };

  return (
    <div className={`bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative flex flex-col justify-between`}>
      <div>
        <div className="flex justify-between items-start mb-4">
            <div className={`p-2 rounded-xl ${getColor()}`}>{getIcon()}</div>
            <div className="flex items-center gap-1">
              {String(content.authorId) === 'sys' && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-100">🏛️ Plataforma</span>
              )}
              {isMyContent && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">✨ Meu</span>
              )}
              {content.isAiGenerated && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-full border border-purple-100"><Sparkles className="w-3 h-3" /> IA</span>
              )}
            </div>
        </div>
        
        <div className="mb-2" onClick={onClick}>
            {isEditingTitle && isMyContent && onEditTitle ? (
              <div className="flex items-center gap-2 mb-1" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onBlur={() => {
                    if (editedTitle.trim() && editedTitle !== content.title) {
                      onEditTitle(editedTitle.trim());
                    }
                    setIsEditingTitle(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (editedTitle.trim() && editedTitle !== content.title) {
                        onEditTitle(editedTitle.trim());
                      }
                      setIsEditingTitle(false);
                    } else if (e.key === 'Escape') {
                      setEditedTitle(content.title);
                      setIsEditingTitle(false);
                    }
                  }}
                  className="flex-1 text-lg font-bold text-slate-800 leading-tight border-2 border-indigo-300 rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <h3 className="flex-1 text-lg font-bold text-slate-800 mb-1 leading-tight group-hover:text-indigo-600 transition">{content.title}</h3>
                {isMyContent && onEditTitle && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditingTitle(true);
                    }}
                    className="p-1 hover:bg-indigo-50 text-indigo-500 rounded transition opacity-0 group-hover:opacity-100"
                    title="Editar título"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
            <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed">{content.description}</p>
        </div>

        {/* Keywords / Tags */}
        {content.keywords && content.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
                {content.keywords.slice(0, 3).map((k, i) => (
                    <span key={i} className="text-[10px] bg-slate-50 text-slate-400 px-2 py-0.5 rounded-md lowercase">#{k}</span>
                ))}
            </div>
        )}
      </div>

      <div>
        {/* Detailed Metadata */}
        <div className="flex flex-col gap-1 text-xs text-slate-400 mb-3 pt-3 border-t border-slate-50">
             {content.grade && (
                 <div className="flex items-center gap-1"><BookOpen className="w-3 h-3"/> <span className="font-bold text-slate-500">{content.grade}</span></div>
             )}
             <div className="flex items-center gap-1"><UserIcon className="w-3 h-3"/> {content.authorName}</div>
             <div className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {new Date(content.createdAt).toLocaleDateString('pt-BR')}</div>
        </div>

        <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md uppercase">{content.subject}</span>
            <div className="flex items-center gap-2">
                {showPrice && content.price > 0 ? (
                    <span className="font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg text-sm">C$ {content.price}</span>
                ) : (
                    <>
                        {onRemix && (
                            <button onClick={(e) => { e.stopPropagation(); onRemix(); }} className="p-2 hover:bg-purple-100 text-purple-500 rounded-full transition" title="Criar Derivado">
                            <Split className="w-4 h-4" />
                            </button>
                        )}
                        <span className="font-bold text-slate-300 text-xs">
                            {content.ageRange.min === content.ageRange.max ? `${content.ageRange.min} anos` : `${content.ageRange.min}-${content.ageRange.max} anos`}
                        </span>
                    </>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default App;
