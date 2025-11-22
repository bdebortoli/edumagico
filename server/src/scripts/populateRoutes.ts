import { AppDataSource } from '../config/database';
import { Route } from '../entities/Route';
import { RoutePermission } from '../entities/RoutePermission';

const routes = [
  { path: '/api/auth/register', method: 'POST', description: 'Registrar novo usuário' },
  { path: '/api/auth/login', method: 'POST', description: 'Fazer login' },
  { path: '/api/auth/me', method: 'GET', description: 'Obter usuário atual' },
  { path: '/api/users/profile', method: 'GET', description: 'Obter perfil do usuário' },
  { path: '/api/users/profile', method: 'PUT', description: 'Atualizar perfil do usuário' },
  { path: '/api/users/subscription', method: 'PUT', description: 'Atualizar assinatura' },
  { path: '/api/content', method: 'GET', description: 'Listar conteúdo do usuário' },
  { path: '/api/content/:id', method: 'GET', description: 'Obter conteúdo por ID' },
  { path: '/api/content', method: 'POST', description: 'Criar novo conteúdo' },
  { path: '/api/content/:id', method: 'PUT', description: 'Atualizar conteúdo' },
  { path: '/api/content/:id', method: 'DELETE', description: 'Deletar conteúdo' },
  { path: '/api/content/generate', method: 'POST', description: 'Gerar conteúdo com IA' },
  { path: '/api/content/chat', method: 'POST', description: 'Chat para criação' },
  { path: '/api/marketplace', method: 'GET', description: 'Listar conteúdo do marketplace' },
  { path: '/api/marketplace/:id', method: 'GET', description: 'Obter item do marketplace' },
  { path: '/api/marketplace/:id/purchase', method: 'POST', description: 'Comprar conteúdo' },
  { path: '/api/family/children', method: 'GET', description: 'Listar filhos' },
  { path: '/api/family/children', method: 'POST', description: 'Criar perfil de filho' },
  { path: '/api/family/children/:id', method: 'PUT', description: 'Atualizar perfil de filho' },
  { path: '/api/family/children/:id', method: 'DELETE', description: 'Deletar perfil de filho' },
  { path: '/api/analytics/activity', method: 'POST', description: 'Registrar conclusão de atividade' },
  { path: '/api/analytics/history', method: 'GET', description: 'Obter histórico de atividades' },
  { path: '/api/analytics/performance', method: 'GET', description: 'Obter desempenho (pais)' },
  { path: '/api/analytics/financial', method: 'GET', description: 'Obter dados financeiros (professores)' }
];

const permissions = [
  // Auth routes - everyone
  { routeIndex: 0, roles: ['parent', 'teacher'] },
  { routeIndex: 1, roles: ['parent', 'teacher'] },
  { routeIndex: 2, roles: ['parent', 'teacher'] },
  // User routes - authenticated
  { routeIndex: 3, roles: ['parent', 'teacher'] },
  { routeIndex: 4, roles: ['parent', 'teacher'] },
  { routeIndex: 5, roles: ['parent', 'teacher'] },
  // Content routes
  { routeIndex: 6, roles: ['parent', 'teacher'] },
  { routeIndex: 7, roles: ['parent', 'teacher'] },
  { routeIndex: 8, roles: ['parent', 'teacher'] },
  { routeIndex: 9, roles: ['parent', 'teacher'] },
  { routeIndex: 10, roles: ['parent', 'teacher'] },
  { routeIndex: 11, roles: ['parent', 'teacher'] },
  { routeIndex: 12, roles: ['parent', 'teacher'] },
  // Marketplace routes
  { routeIndex: 13, roles: ['parent', 'teacher'] },
  { routeIndex: 14, roles: ['parent', 'teacher'] },
  { routeIndex: 15, roles: ['parent'] }, // Teachers can't buy
  // Family routes - parents only
  { routeIndex: 16, roles: ['parent'] },
  { routeIndex: 17, roles: ['parent'] },
  { routeIndex: 18, roles: ['parent'] },
  { routeIndex: 19, roles: ['parent'] },
  // Analytics routes
  { routeIndex: 20, roles: ['parent', 'teacher'] },
  { routeIndex: 21, roles: ['parent', 'teacher'] },
  { routeIndex: 22, roles: ['parent'] },
  { routeIndex: 23, roles: ['teacher'] }
];

export async function populateRoutes() {
  try {
    await AppDataSource.initialize();
    
    const routeRepository = AppDataSource.getRepository(Route);
    const permissionRepository = AppDataSource.getRepository(RoutePermission);

    // Insert routes
    const savedRoutes = [];
    for (const routeData of routes) {
      let route = await routeRepository.findOne({
        where: { path: routeData.path, method: routeData.method }
      });

      if (!route) {
        route = routeRepository.create(routeData);
        route = await routeRepository.save(route);
      }

      savedRoutes.push(route);
    }

    // Insert permissions
    for (const perm of permissions) {
      const route = savedRoutes[perm.routeIndex];
      
      for (const role of perm.roles) {
        let permission = await permissionRepository.findOne({
          where: { rotaId: route.id, role: role as 'parent' | 'teacher' | 'admin' }
        });

        if (!permission) {
          permission = permissionRepository.create({
            rotaId: route.id,
            role: role as 'parent' | 'teacher' | 'admin',
            allowed: true
          });
          await permissionRepository.save(permission);
        }
      }
    }

    console.log('✅ Routes and permissions populated successfully');
  } catch (error) {
    console.error('❌ Error populating routes:', error);
    throw error;
  } finally {
    await AppDataSource.destroy();
  }
}

// Run if called directly
if (require.main === module) {
  populateRoutes()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

