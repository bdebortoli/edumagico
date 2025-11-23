import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, BookOpen, CreditCard, Bell, 
  TrendingUp, DollarSign, BarChart3, FileText, Settings,
  Search, Filter, Calendar, Download, Eye, Edit, Trash2,
  UserCheck, UserX, Award, Clock, Activity, PieChart,
  Mail, Send, Plus, X, CheckCircle, AlertCircle, Info,
  ArrowUp, ArrowDown, RefreshCw, MoreVertical, Shield,
  UserPlus, FileText as FileTextIcon, TrendingDown
} from 'lucide-react';

// ========== INTERFACES ==========
interface DashboardStats {
  totalUsers: number;
  totalParents: number;
  totalTeachers: number;
  totalStudents: number;
  totalContent: number;
  totalAccesses: number;
  totalRevenue: number;
  monthlyRevenue: number;
  activeUsers: number;
  newUsersThisMonth: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'parent' | 'teacher' | 'admin';
  plan: 'basic' | 'premium';
  createdAt: string;
  subscription?: {
    status: string;
    cycle: string;
    nextBillingDate?: string;
  };
  children?: ChildProfile[];
  coins?: number;
}

interface ChildProfile {
  id: string;
  name: string;
  birthDate?: string; // Data de nascimento no formato ISO (YYYY-MM-DD)
  age?: number; // Calculado a partir de birthDate, mantido para compatibilidade
  grade: string;
  points: number;
  school?: string;
}

interface Content {
  id: string;
  title: string;
  type: string;
  authorName: string;
  authorId: string;
  createdAt: string;
  price: number;
  salesCount: number;
  subject: string;
}

interface Access {
  id: string;
  userId: string;
  user: User;
  loginAt: string;
  logoutAt?: string;
  sessionDuration: number;
  ipAddress?: string;
  userAgent?: string;
}

interface Transaction {
  id: string;
  userId: string;
  user?: User;
  type: 'income' | 'expense';
  category?: 'subscription' | 'content_sale' | 'refund' | 'payout' | 'other';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description?: string;
  createdAt: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'alert' | 'promotion';
  targetType: 'all' | 'parent' | 'teacher' | 'specific';
  targetUserId?: string;
  isRead: boolean;
  createdAt: string;
}

interface Subscription {
  userId: string;
  user: User;
  status: string;
  plan: string;
  cycle: string;
  nextBillingDate?: string;
  createdAt: string;
}

interface TeacherRanking {
  teacherId: string;
  teacher: User;
  totalRevenue: number;
  totalMaterials: number;
  averageRating: number;
  totalRatings: number;
  totalSales: number;
}

interface UsageReport {
  userId: string;
  user: User;
  totalAccesses: number;
  totalTimeSpent: number;
  lastAccess: string;
  activitiesCompleted: number;
}

const API_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3001/api';

interface AdminDashboardProps {
  currentView?: string;
  onViewChange?: (view: string) => void;
}

export default function AdminDashboard({ currentView, onViewChange }: AdminDashboardProps) {
  // Extrai a view do currentView (remove 'admin_' se presente)
  const getViewName = (): 'dashboard' | 'users' | 'content' | 'subscriptions' | 'notifications' | 'financial' | 'rankings' | 'reports' | 'accesses' | 'permissions' => {
    if (!currentView) return 'dashboard';
    const view = currentView.replace('admin_', '');
    const validViews = ['dashboard', 'users', 'content', 'subscriptions', 'notifications', 'financial', 'rankings', 'reports', 'accesses', 'permissions'];
    return (validViews.includes(view) ? view : 'dashboard') as any;
  };
  
  const activeTab = getViewName();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [accesses, setAccesses] = useState<Access[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [rankings, setRankings] = useState<TeacherRanking[]>([]);
  const [usageReports, setUsageReports] = useState<UsageReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [routes, setRoutes] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  
  const [filters, setFilters] = useState({
    role: '',
    search: '',
    startDate: '',
    endDate: '',
    status: '',
    type: ''
  });

  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'alert' | 'promotion',
    targetType: 'all' as 'all' | 'parent' | 'teacher' | 'specific',
    targetUserId: ''
  });

  const token = localStorage.getItem('token') || '';
  
  // Debug: log token status
  useEffect(() => {
    console.log('[AdminDashboard] Token status:', token ? 'Token exists' : 'No token');
    console.log('[AdminDashboard] Current view:', currentView);
    console.log('[AdminDashboard] Active tab:', activeTab);
  }, [token, currentView, activeTab]);

  // ========== LOAD DATA ==========
  useEffect(() => {
    console.log('[AdminDashboard] activeTab changed to:', activeTab);
    if (activeTab === 'dashboard') loadDashboard();
    if (activeTab === 'users') {
      console.log('[AdminDashboard] Loading users...');
      loadUsers();
    }
    if (activeTab === 'content') loadContent();
    if (activeTab === 'accesses') loadAccesses();
    if (activeTab === 'financial') loadTransactions();
    if (activeTab === 'notifications') loadNotifications();
    if (activeTab === 'subscriptions') loadSubscriptions();
    if (activeTab === 'rankings') loadRankings();
    if (activeTab === 'reports') loadUsageReports();
    if (activeTab === 'permissions') loadPermissions();
  }, [activeTab]);
  
  // Recarrega quando os filtros mudam
  useEffect(() => {
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'accesses') loadAccesses();
    if (activeTab === 'financial') loadTransactions();
    if (activeTab === 'reports') loadUsageReports();
  }, [filters]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
        console.error('Erro ao carregar dashboard:', errorData);
        return;
      }
      
      const data = await res.json();
      setStats(data.stats);
    } catch (error: any) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      console.log('[loadUsers] Starting... Token exists:', !!token);
      const params = new URLSearchParams();
      if (filters.role) params.append('role', filters.role);
      if (filters.search) params.append('search', filters.search);
      
      const url = `${API_BASE}/admin/users?${params}`;
      console.log('[loadUsers] Fetching:', url);
      console.log('[loadUsers] Token (first 50 chars):', token.substring(0, 50) + '...');
      
      const res = await fetch(url, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('[loadUsers] Response status:', res.status, res.statusText);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('[loadUsers] Error - Status:', res.status, 'Response:', errorText);
        setUsers([]);
        return;
      }
      
      const data = await res.json();
      console.log('[loadUsers] Success! Users loaded:', data.users?.length || 0, 'users');
      console.log('[loadUsers] Data:', data);
      setUsers(data.users || []);
    } catch (error: any) {
      console.error('[loadUsers] Exception:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadContent = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/content`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      setContents(data.contents || []);
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAccesses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.search) params.append('userId', filters.search);
      
      const res = await fetch(`${API_BASE}/admin/accesses?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      setAccesses(data.accesses || []);
    } catch (error) {
      console.error('Error loading accesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);
      
      const res = await fetch(`${API_BASE}/admin/financial/transactions?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSubscriptions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/subscriptions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        console.error('[loadSubscriptions] Error:', res.status);
        setSubscriptions([]);
        return;
      }
      const data = await res.json();
      console.log('[loadSubscriptions] Data received:', data);
      // O backend retorna { subscriptions: users[], total, page, limit }
      // onde users são objetos User com subscription dentro
      setSubscriptions(data.subscriptions || []);
    } catch (error) {
      console.error('[loadSubscriptions] Exception:', error);
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadRankings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/rankings/teachers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      setRankings(data.rankings || []);
    } catch (error) {
      console.error('Error loading rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsageReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.role) params.append('role', filters.role);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      const res = await fetch(`${API_BASE}/admin/reports/usage?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      setUsageReports(data.reports || []);
    } catch (error) {
      console.error('Error loading usage reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPermissions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/permissions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      setRoutes(data.routes || []);
      setPermissions(data.permissions || []);
    } catch (error: any) {
      console.error('Error loading permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  // ========== ACTIONS ==========
  const handleViewUser = async (userId: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      setSelectedUser(data.user);
      setUserDetails(data); // Armazena todos os detalhes retornados
      setShowUserModal(true);
    } catch (error) {
      console.error('Error loading user details:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja deletar este usuário?')) return;
    
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        loadUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleDeleteContent = async (contentId: string) => {
    if (!confirm('Tem certeza que deseja deletar este conteúdo?')) return;
    
    try {
      const res = await fetch(`${API_BASE}/admin/content/${contentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        loadContent();
      }
    } catch (error) {
      console.error('Error deleting content:', error);
    }
  };

  const handleCreateNotification = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/notifications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newNotification)
      });
      if (res.ok) {
        setShowNotificationModal(false);
        setNewNotification({
          title: '',
          message: '',
          type: 'info',
          targetType: 'all',
          targetUserId: ''
        });
        loadNotifications();
      }
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  const handleUpdateSubscription = async (userId: string, updates: any) => {
    try {
      const res = await fetch(`${API_BASE}/admin/subscriptions/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        setShowSubscriptionModal(false);
        loadSubscriptions();
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
    }
  };

  const updatePermission = async (routeId: number, role: string, allowed: boolean) => {
    try {
      const res = await fetch(`${API_BASE}/admin/permissions`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ routeId, role, allowed })
      });
      if (res.ok) {
        await loadPermissions();
      }
    } catch (error: any) {
      console.error('Error updating permission:', error);
    }
  };

  // ========== FORMATTERS ==========
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // ========== RENDER FUNCTION ==========
  function renderContentView(view: string) {
    // Loading State
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
          <span className="ml-3 text-gray-600">Carregando...</span>
        </div>
      );
    }

    // Dashboard Tab
    if (view === 'dashboard' && stats) {
      return (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total de Usuários"
              value={stats.totalUsers}
              icon={<Users className="w-6 h-6" />}
              color="bg-blue-500"
              trend={stats.newUsersThisMonth ? `+${stats.newUsersThisMonth} este mês` : undefined}
            />
            <StatCard
              title="Receita Total"
              value={formatCurrency(stats.totalRevenue)}
              icon={<DollarSign className="w-6 h-6" />}
              color="bg-green-500"
            />
            <StatCard
              title="Receita Mensal"
              value={formatCurrency(stats.monthlyRevenue)}
              icon={<TrendingUp className="w-6 h-6" />}
              color="bg-purple-500"
            />
            <StatCard
              title="Acessos Totais"
              value={stats.totalAccesses}
              icon={<Activity className="w-6 h-6" />}
              color="bg-orange-500"
            />
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Responsáveis"
              value={stats.totalParents}
              icon={<Users className="w-5 h-5" />}
              color="bg-green-500"
              small
            />
            <StatCard
              title="Professores"
              value={stats.totalTeachers}
              icon={<Users className="w-5 h-5" />}
              color="bg-blue-500"
              small
            />
            <StatCard
              title="Alunos"
              value={stats.totalStudents}
              icon={<Users className="w-5 h-5" />}
              color="bg-purple-500"
              small
            />
            <StatCard
              title="Conteúdos"
              value={stats.totalContent}
              icon={<BookOpen className="w-5 h-5" />}
              color="bg-indigo-500"
              small
            />
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <QuickActionButton
                icon={<Bell className="w-5 h-5" />}
                label="Criar Notificação"
                onClick={() => { if (onViewChange) onViewChange('notifications'); else setShowNotificationModal(true); }}
                color="bg-blue-500"
              />
              <QuickActionButton
                icon={<UserPlus className="w-5 h-5" />}
                label="Ver Usuários"
                onClick={() => { if (onViewChange) onViewChange('users'); }}
                color="bg-green-500"
              />
              <QuickActionButton
                icon={<FileTextIcon className="w-5 h-5" />}
                label="Relatórios"
                onClick={() => { if (onViewChange) onViewChange('reports'); }}
                color="bg-purple-500"
              />
            </div>
          </div>
        </div>
      );
    }

    // Users Tab
    if (view === 'users') {
      return (
        <UsersManagement
          users={users}
          filters={filters}
          onFiltersChange={setFilters}
          onViewUser={handleViewUser}
          onDeleteUser={handleDeleteUser}
        />
      );
    }

    // Content Tab
    if (view === 'content') {
      return (
        <ContentManagement
          contents={contents}
          onDeleteContent={handleDeleteContent}
        />
      );
    }

    // Subscriptions Tab
    if (view === 'subscriptions') {
      return (
        <SubscriptionsManagement
          subscriptions={subscriptions}
          onUpdateSubscription={handleUpdateSubscription}
        />
      );
    }

    // Notifications Tab
    if (view === 'notifications') {
      return (
        <NotificationsManagement
          notifications={notifications}
          onCreateNotification={() => setShowNotificationModal(true)}
        />
      );
    }

    // Financial Tab
    if (view === 'financial') {
      return (
        <FinancialManagement
          transactions={transactions}
          filters={filters}
          onFiltersChange={setFilters}
        />
      );
    }

    // Rankings Tab
    if (view === 'rankings') {
      return (
        <RankingsManagement rankings={rankings} />
      );
    }

    // Reports Tab
    if (view === 'reports') {
      return (
        <ReportsManagement
          reports={usageReports}
          filters={filters}
          onFiltersChange={setFilters}
          formatDuration={formatDuration}
        />
      );
    }

    // Accesses Tab
    if (view === 'accesses') {
      return (
        <AccessesManagement
          accesses={accesses}
          filters={filters}
          onFiltersChange={setFilters}
          formatDate={formatDate}
          formatDuration={formatDuration}
        />
      );
    }

    // Permissions Tab
    if (view === 'permissions') {
      return (
        <PermissionsManagement
          routes={routes}
          permissions={permissions}
          onUpdatePermission={updatePermission}
        />
      );
    }

    // Default: Dashboard
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Selecione uma opção no menu</p>
      </div>
    );
  }

  // Render modals outside of renderContentView
  return (
    <>
      {renderContentView(activeTab)}
      
      {/* Modals */}
      {showUserModal && selectedUser && userDetails && (
        <UserDetailModal
          user={selectedUser}
          details={userDetails}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUser(null);
            setUserDetails(null);
          }}
          onViewContent={(teacherId: string) => {
            if (onViewChange) {
              onViewChange('content');
              // TODO: Filtrar por teacherId quando implementar filtros
            }
          }}
        />
      )}

      {showNotificationModal && (
        <NotificationModal
          notification={newNotification}
          onNotificationChange={setNewNotification}
          onSave={handleCreateNotification}
          onClose={() => setShowNotificationModal(false)}
        />
      )}
    </>
  );
}

// ========== COMPONENTES AUXILIARES ==========

const StatCard = ({ title, value, icon, color, small, trend }: any) => (
  <div className={`bg-white rounded-xl shadow-sm p-6 border border-gray-200 ${small ? 'p-4' : ''}`}>
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className={`text-gray-600 font-medium ${small ? 'text-sm' : 'text-sm'}`}>{title}</p>
        <p className={`font-bold text-gray-900 mt-2 ${small ? 'text-2xl' : 'text-3xl'}`}>{value}</p>
        {trend && <p className="text-xs text-green-600 mt-1">{trend}</p>}
      </div>
      <div className={`${color} text-white p-3 rounded-lg ${small ? 'p-2' : 'p-3'}`}>
        {icon}
      </div>
    </div>
  </div>
);

const QuickActionButton = ({ icon, label, onClick, color }: any) => (
  <button
    onClick={onClick}
    className={`${color} text-white p-4 rounded-lg hover:opacity-90 transition flex items-center gap-3 font-semibold`}
  >
    {icon}
    {label}
  </button>
);

const UsersManagement = ({ users, filters, onFiltersChange, onViewUser, onDeleteUser }: any) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200">
    <div className="p-6 border-b border-gray-200">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-xl font-bold text-gray-900">Gerenciar Usuários</h2>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filters.role}
            onChange={(e) => onFiltersChange({ ...filters, role: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Todos os perfis</option>
            <option value="parent">Responsáveis</option>
            <option value="teacher">Professores</option>
            <option value="admin">Administradores</option>
          </select>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={filters.search}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Usuário</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Perfil</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Plano</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Alunos</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cadastro</th>
            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {users.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                Nenhum usuário encontrado
              </td>
            </tr>
          ) : (
            users.map((user: User) => (
              <tr key={user.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-indigo-600 font-semibold">{user.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                    user.role === 'teacher' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {user.role === 'admin' ? 'Admin' : user.role === 'teacher' ? 'Professor' : 'Responsável'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    user.plan === 'premium' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.plan === 'premium' ? 'Premium' : 'Básico'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {user.role === 'parent' ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                      {user.children?.length || 0} {user.children?.length === 1 ? 'aluno' : 'alunos'}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onViewUser(user.id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Ver detalhes"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteUser(user.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Deletar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const ContentManagement = ({ contents, onDeleteContent }: any) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200">
    <div className="p-6 border-b border-gray-200">
      <h2 className="text-xl font-bold text-gray-900">Gerenciar Conteúdos</h2>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Título</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Autor</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tipo</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Preço</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Vendas</th>
            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {contents.map((content: Content) => (
            <tr key={content.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 font-medium text-gray-900">{content.title}</td>
              <td className="px-6 py-4 text-gray-600">{content.authorName}</td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                  {content.type}
                </span>
              </td>
              <td className="px-6 py-4 font-semibold text-gray-900">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(content.price)}
              </td>
              <td className="px-6 py-4 text-gray-600">{content.salesCount}</td>
              <td className="px-6 py-4">
                <button
                  onClick={() => onDeleteContent(content.id)}
                  className="mx-auto p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const SubscriptionsManagement = ({ subscriptions, onUpdateSubscription }: any) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200">
    <div className="p-6 border-b border-gray-200">
      <h2 className="text-xl font-bold text-gray-900">Gerenciar Assinaturas</h2>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Usuário</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Plano</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Próximo Pagamento</th>
            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {subscriptions && Array.isArray(subscriptions) && subscriptions.length > 0 ? (
            subscriptions
              .filter((user: any) => user && typeof user === 'object' && user.name)
              .map((user: any) => {
                const subscription = user.subscription || {};
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">{user.name || 'N/A'}</p>
                        <p className="text-sm text-gray-500">{user.email || ''}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        user.plan === 'premium' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.plan === 'premium' ? 'Premium' : 'Básico'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        subscription.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {subscription.status === 'active' ? 'Ativa' : subscription.status === 'inactive' ? 'Inativa' : 'Cancelada'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {subscription.nextBillingDate ? new Date(subscription.nextBillingDate).toLocaleDateString('pt-BR') : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <button className="mx-auto p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
          ) : (
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                Nenhuma assinatura encontrada
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const NotificationsManagement = ({ notifications, onCreateNotification }: any) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200">
    <div className="p-6 border-b border-gray-200 flex items-center justify-between">
      <h2 className="text-xl font-bold text-gray-900">Notificações e Comunicações</h2>
      <button
        onClick={onCreateNotification}
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 font-semibold"
      >
        <Plus className="w-4 h-4" />
        Nova Notificação
      </button>
    </div>
    <div className="p-6">
      <div className="space-y-4">
        {notifications.map((notification: Notification) => (
          <div key={notification.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    notification.type === 'info' ? 'bg-blue-100 text-blue-800' :
                    notification.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                    notification.type === 'alert' ? 'bg-red-100 text-red-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {notification.type}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>Destino: {notification.targetType === 'all' ? 'Todos' : notification.targetType}</span>
                  <span>{new Date(notification.createdAt).toLocaleString('pt-BR')}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const FinancialManagement = ({ transactions, filters, onFiltersChange }: any) => (
  <div className="space-y-6">
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold text-gray-900">Transações Financeiras</h2>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filters.type}
            onChange={(e) => onFiltersChange({ ...filters, type: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Todos os tipos</option>
            <option value="income">Receita</option>
            <option value="expense">Despesa</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Todos os status</option>
            <option value="completed">Completo</option>
            <option value="pending">Pendente</option>
            <option value="failed">Falhou</option>
          </select>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => onFiltersChange({ ...filters, startDate: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => onFiltersChange({ ...filters, endDate: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Data</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Usuário</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Valor</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {transactions.map((transaction: Transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(transaction.createdAt).toLocaleString('pt-BR')}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {transaction.user?.name || 'N/A'}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                      {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                    </span>
                    {transaction.category && (
                      <span className="text-xs text-gray-500">{transaction.category}</span>
                    )}
                  </div>
                </td>
                <td className={`px-6 py-4 font-semibold ${
                  transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'income' ? '+' : '-'}
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.amount)}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                    transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {transaction.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const RankingsManagement = ({ rankings }: any) => (
  <div className="space-y-6">
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Ranking de Professores</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Posição</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Professor</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Receita</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Materiais</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Avaliação</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Vendas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rankings.map((ranking: TeacherRanking, index: number) => (
              <tr key={ranking.teacherId} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-800' :
                    index === 1 ? 'bg-gray-100 text-gray-800' :
                    index === 2 ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {index + 1}
                  </div>
                </td>
                <td className="px-6 py-4 font-semibold text-gray-900">{ranking.teacher.name}</td>
                <td className="px-6 py-4 font-semibold text-green-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ranking.totalRevenue)}
                </td>
                <td className="px-6 py-4 text-gray-600">{ranking.totalMaterials}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{ranking.averageRating.toFixed(1)}</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Award
                          key={i}
                          className={`w-4 h-4 ${i < Math.round(ranking.averageRating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">({ranking.totalRatings})</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{ranking.totalSales}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const ReportsManagement = ({ reports, filters, onFiltersChange, formatDuration }: any) => {
  const formatDurationLocal = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold text-gray-900">Relatórios de Uso</h2>
        <div className="flex items-center gap-3">
          <select
            value={filters.role}
            onChange={(e) => onFiltersChange({ ...filters, role: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Todos os perfis</option>
            <option value="parent">Responsáveis</option>
            <option value="teacher">Professores</option>
          </select>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => onFiltersChange({ ...filters, startDate: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => onFiltersChange({ ...filters, endDate: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Usuário</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total de Acessos</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tempo Total</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Último Acesso</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Atividades</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {reports.map((report: UsageReport) => (
              <tr key={report.userId} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-semibold text-gray-900">{report.user.name}</p>
                    <p className="text-sm text-gray-500">{report.user.email}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{report.totalAccesses}</td>
                <td className="px-6 py-4 font-semibold text-gray-900">
                  {formatDuration ? formatDuration(report.totalTimeSpent) : formatDurationLocal(report.totalTimeSpent)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(report.lastAccess).toLocaleString('pt-BR')}
                </td>
                <td className="px-6 py-4 text-gray-600">{report.activitiesCompleted}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AccessesManagement = ({ accesses, filters, onFiltersChange, formatDate, formatDuration }: any) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200">
    <div className="p-6 border-b border-gray-200">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-xl font-bold text-gray-900">Registro de Acessos</h2>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => onFiltersChange({ ...filters, startDate: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => onFiltersChange({ ...filters, endDate: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
      </div>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Usuário</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Login</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Logout</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Duração</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">IP</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {accesses.map((access: Access) => (
            <tr key={access.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div>
                  <p className="font-semibold text-gray-900">{access.user?.name || 'N/A'}</p>
                  <p className="text-sm text-gray-500">{access.user?.email || ''}</p>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">{formatDate(access.loginAt)}</td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {access.logoutAt ? formatDate(access.logoutAt) : <span className="text-green-600 font-semibold">Ativo</span>}
              </td>
              <td className="px-6 py-4 font-semibold text-gray-900">{formatDuration(access.sessionDuration)}</td>
              <td className="px-6 py-4 text-sm text-gray-500">{access.ipAddress || 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const PermissionsManagement = ({ routes, permissions, onUpdatePermission }: any) => {
  const getPermission = (routeId: number, role: string) => {
    const perm = permissions.find((p: any) => p.rotaId === routeId && p.role === role);
    return perm ? perm.allowed : false;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">Gerenciar Níveis de Acesso</h2>
        <p className="text-sm text-gray-600 mt-2">Configure quais perfis podem acessar cada rota da API</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rota</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Método</th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Admin</th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Responsável</th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Professor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {routes.map((route: any) => (
              <tr key={route.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{route.path}</div>
                  {route.description && (
                    <div className="text-xs text-gray-500 mt-1">{route.description}</div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                    {route.method}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={getPermission(route.id, 'admin')}
                      onChange={(e) => onUpdatePermission(route.id, 'admin', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </td>
                <td className="px-6 py-4 text-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={getPermission(route.id, 'parent')}
                      onChange={(e) => onUpdatePermission(route.id, 'parent', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </td>
                <td className="px-6 py-4 text-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={getPermission(route.id, 'teacher')}
                      onChange={(e) => onUpdatePermission(route.id, 'teacher', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const UserDetailModal = ({ user, details, onClose, onViewContent }: any) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (date: string | Date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getPaymentMethodLabel = (method?: string) => {
    const methods: any = {
      'credit_card': 'Cartão de Crédito',
      'debit_card': 'Cartão de Débito',
      'pix': 'PIX',
      'boleto': 'Boleto',
      'bank_transfer': 'Transferência Bancária'
    };
    return method ? methods[method] || method : '-';
  };

  // ADMIN: Apenas nome, email e telefone
  if (user.role === 'admin') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Detalhes do Administrador</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-600">Nome</label>
              <p className="text-gray-900 font-medium">{user.name}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">Email</label>
              <p className="text-gray-900 font-medium">{user.email}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">Telefone</label>
              <p className="text-gray-900 font-medium">{user.phoneNumber || '-'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PARENT: Todos os dados (exceto cartão), alunos, plano, faturas, total pago, tempo de uso, último acesso
  if (user.role === 'parent') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Detalhes do Responsável</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 space-y-6">
            {/* Dados Pessoais */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados Pessoais</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600">Nome</label>
                  <p className="text-gray-900">{user.name}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Email</label>
                  <p className="text-gray-900">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Telefone</label>
                  <p className="text-gray-900">{user.phoneNumber || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">CPF</label>
                  <p className="text-gray-900">{user.cpf || '-'}</p>
                </div>
                {user.birthDate && (
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Data de Nascimento</label>
                    <p className="text-gray-900">{formatDate(user.birthDate)}</p>
                  </div>
                )}
                {user.address && (
                  <div className="col-span-2">
                    <label className="text-sm font-semibold text-gray-600">Endereço</label>
                    <p className="text-gray-900">
                      {user.address.street}, {user.address.number}
                      {user.address.complement && ` - ${user.address.complement}`}
                      <br />
                      {user.address.city} - {user.address.state}, {user.address.zipCode}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Alunos Vinculados */}
            {user.children && user.children.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Alunos Vinculados</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.children.map((child: ChildProfile) => {
                    // Calcula idade a partir da data de nascimento se disponível
                    const calculateAge = (birthDate?: string): number | undefined => {
                      if (!birthDate) return child.age;
                      const birth = new Date(birthDate);
                      const today = new Date();
                      let age = today.getFullYear() - birth.getFullYear();
                      const monthDiff = today.getMonth() - birth.getMonth();
                      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                        age--;
                      }
                      return age;
                    };
                    const age = child.birthDate ? calculateAge(child.birthDate) : child.age;
                    
                    return (
                      <div key={child.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="font-semibold text-gray-900">{child.name}</p>
                        <p className="text-sm text-gray-600">{age || 'N/A'} anos - {child.grade}</p>
                        {child.school && <p className="text-sm text-gray-600">Escola: {child.school}</p>}
                        <p className="text-sm text-gray-600 mt-2">Pontos: {child.points}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Plano e Assinatura */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Plano e Assinatura</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600">Plano Atual</label>
                  <p className="text-gray-900 font-medium">{user.plan === 'premium' ? 'Premium' : 'Básico'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Status da Assinatura</label>
                  <p className="text-gray-900 font-medium">
                    {details.subscriptionStatus === 'active' ? 'Ativa' : 
                     details.subscriptionStatus === 'inactive' ? 'Inativa' : 'Cancelada'}
                  </p>
                </div>
                {user.subscription?.nextBillingDate && (
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Próxima Cobrança</label>
                    <p className="text-gray-900">{formatDate(user.subscription.nextBillingDate)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Total Pago */}
            {details.totalPaid !== undefined && (
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Pago</h3>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(details.totalPaid)}</p>
              </div>
            )}

            {/* Faturas */}
            {details.invoices && details.invoices.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Faturas</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-gray-600">Data Vencimento</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-600">Valor</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-600">Forma de Pagamento</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-600">Data Pagamento</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {details.invoices.map((invoice: any) => (
                        <tr key={invoice.id}>
                          <td className="px-4 py-2">{formatDate(invoice.dueDate)}</td>
                          <td className="px-4 py-2 font-medium">{formatCurrency(invoice.amount)}</td>
                          <td className="px-4 py-2">{getPaymentMethodLabel(invoice.paymentMethod)}</td>
                          <td className="px-4 py-2">{invoice.paidAt ? formatDate(invoice.paidAt) : '-'}</td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                              invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              invoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {invoice.status === 'paid' ? 'Pago' :
                               invoice.status === 'pending' ? 'Pendente' :
                               invoice.status === 'overdue' ? 'Vencido' : 'Cancelado'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tempo de Uso e Último Acesso */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Uso da Plataforma</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600">Tempo Total de Uso</label>
                  <p className="text-gray-900 font-medium">
                    {details.totalTimeOnPlatform ? formatDuration(details.totalTimeOnPlatform) : '0m'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Último Acesso</label>
                  <p className="text-gray-900 font-medium">
                    {details.lastAccess?.loginAt ? formatDate(details.lastAccess.loginAt) : 'Nunca'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // TEACHER: Todos os dados, tempo de uso, materiais, vendas, total recebido, avaliação
  if (user.role === 'teacher') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Detalhes do Professor</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 space-y-6">
            {/* Dados Pessoais */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados Pessoais</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600">Nome</label>
                  <p className="text-gray-900">{user.name}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Email</label>
                  <p className="text-gray-900">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Telefone</label>
                  <p className="text-gray-900">{user.phoneNumber || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">CPF</label>
                  <p className="text-gray-900">{user.cpf || '-'}</p>
                </div>
                {user.birthDate && (
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Data de Nascimento</label>
                    <p className="text-gray-900">{formatDate(user.birthDate)}</p>
                  </div>
                )}
                {user.address && (
                  <div className="col-span-2">
                    <label className="text-sm font-semibold text-gray-600">Endereço</label>
                    <p className="text-gray-900">
                      {user.address.street}, {user.address.number}
                      {user.address.complement && ` - ${user.address.complement}`}
                      <br />
                      {user.address.city} - {user.address.state}, {user.address.zipCode}
                    </p>
                  </div>
                )}
                {user.teacherProfile && (
                  <>
                    {user.teacherProfile.bio && (
                      <div className="col-span-2">
                        <label className="text-sm font-semibold text-gray-600">Biografia</label>
                        <p className="text-gray-900">{user.teacherProfile.bio}</p>
                      </div>
                    )}
                    {user.teacherProfile.subjects && user.teacherProfile.subjects.length > 0 && (
                      <div className="col-span-2">
                        <label className="text-sm font-semibold text-gray-600">Matérias</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {user.teacherProfile.subjects.map((subject: string, idx: number) => (
                            <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              {subject}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <label className="text-sm font-semibold text-gray-600">Materiais Criados</label>
                <p className="text-2xl font-bold text-blue-600">{details.contentsCount || 0}</p>
                {details.contentsCount > 0 && onViewContent && (
                  <button
                    onClick={() => onViewContent(user.id)}
                    className="mt-2 text-sm text-blue-600 hover:underline"
                  >
                    Ver materiais →
                  </button>
                )}
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <label className="text-sm font-semibold text-gray-600">Total Recebido</label>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(details.totalEarnings || 0)}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <label className="text-sm font-semibold text-gray-600">Avaliação Geral</label>
                <p className="text-2xl font-bold text-purple-600">
                  {details.averageRating ? details.averageRating.toFixed(1) : '0.0'}
                </p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <label className="text-sm font-semibold text-gray-600">Vendas</label>
                <p className="text-2xl font-bold text-orange-600">{details.salesCount || 0}</p>
              </div>
            </div>

            {/* Tempo de Uso */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Uso da Plataforma</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600">Tempo Total de Uso</label>
                  <p className="text-gray-900 font-medium">
                    {details.totalTimeOnPlatform ? formatDuration(details.totalTimeOnPlatform) : '0m'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Último Acesso</label>
                  <p className="text-gray-900 font-medium">
                    {details.lastAccess?.loginAt ? formatDate(details.lastAccess.loginAt) : 'Nunca'}
                  </p>
                </div>
              </div>
            </div>

            {/* Faturas de Vendas */}
            {details.salesInvoices && details.salesInvoices.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Faturas de Vendas</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-gray-600">Data</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-600">Valor</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-600">Descrição</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {details.salesInvoices.map((invoice: any) => (
                        <tr key={invoice.id}>
                          <td className="px-4 py-2">{formatDate(invoice.createdAt)}</td>
                          <td className="px-4 py-2 font-medium">{formatCurrency(invoice.amount)}</td>
                          <td className="px-4 py-2">{invoice.description || '-'}</td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              invoice.status === 'completed' ? 'bg-green-100 text-green-800' :
                              invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {invoice.status === 'completed' ? 'Concluído' :
                               invoice.status === 'pending' ? 'Pendente' : 'Falhou'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

const NotificationModal = ({ notification, onNotificationChange, onSave, onClose }: any) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Criar Notificação</h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Título</label>
          <input
            type="text"
            value={notification.title}
            onChange={(e) => onNotificationChange({ ...notification, title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Título da notificação"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Mensagem</label>
          <textarea
            value={notification.message}
            onChange={(e) => onNotificationChange({ ...notification, message: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            rows={4}
            placeholder="Mensagem da notificação"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo</label>
          <select
            value={notification.type}
            onChange={(e) => onNotificationChange({ ...notification, type: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="info">Informação</option>
            <option value="warning">Aviso</option>
            <option value="alert">Alerta</option>
            <option value="promotion">Promoção</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Destino</label>
          <select
            value={notification.targetType}
            onChange={(e) => onNotificationChange({ ...notification, targetType: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">Todos</option>
            <option value="parent">Responsáveis</option>
            <option value="teacher">Professores</option>
            <option value="specific">Usuário Específico</option>
          </select>
        </div>
        <div className="flex items-center gap-3 pt-4">
          <button
            onClick={onSave}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
          >
            Enviar Notificação
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>
);
