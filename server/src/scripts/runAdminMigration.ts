import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
  try {
    console.log('🔄 Conectando ao banco de dados...');
    await AppDataSource.initialize();
    console.log('✅ Conectado ao banco de dados');

    const migrationPath = path.join(__dirname, '../migrations/003_populate_admin_routes.sql');
    console.log(`📄 Lendo arquivo de migração: ${migrationPath}`);
    
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    
    // Remove comentários de linha (-- comentário)
    const sqlWithoutComments = sql
      .split('\n')
      .map(line => {
        const commentIndex = line.indexOf('--');
        if (commentIndex >= 0) {
          return line.substring(0, commentIndex);
        }
        return line;
      })
      .join('\n');

    // Divide o SQL em comandos individuais (separados por ;)
    const commands = sqlWithoutComments
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && cmd.length > 10); // Filtra comandos muito curtos (apenas espaços)

    console.log(`📝 Executando ${commands.length} comandos SQL...`);

    // Primeiro, executa o INSERT de rotas (sem ON CONFLICT, verificando antes)
    const routesCommand = commands[0];
    if (routesCommand && routesCommand.trim().length > 10) {
      try {
        // Remove ON CONFLICT e insere apenas se não existir
        const routesToInsert = [
          { path: '/api/admin/dashboard', method: 'GET', description: 'Dashboard administrativo' },
          { path: '/api/admin/users', method: 'GET', description: 'Listar usuários' },
          { path: '/api/admin/users/:id', method: 'GET', description: 'Obter detalhes do usuário' },
          { path: '/api/admin/users/:id', method: 'PUT', description: 'Atualizar usuário' },
          { path: '/api/admin/users/:id', method: 'DELETE', description: 'Deletar usuário' },
          { path: '/api/admin/content', method: 'GET', description: 'Listar conteúdos' },
          { path: '/api/admin/content/:id', method: 'DELETE', description: 'Deletar conteúdo' },
          { path: '/api/admin/subscriptions', method: 'GET', description: 'Listar assinaturas' },
          { path: '/api/admin/subscriptions/:userId', method: 'PUT', description: 'Atualizar assinatura' },
          { path: '/api/admin/notifications', method: 'POST', description: 'Criar notificação' },
          { path: '/api/admin/notifications', method: 'GET', description: 'Listar notificações' },
          { path: '/api/admin/financial/transactions', method: 'GET', description: 'Listar transações financeiras' },
          { path: '/api/admin/financial/reports/monthly', method: 'GET', description: 'Relatório mensal' },
          { path: '/api/admin/financial/reports/dre', method: 'GET', description: 'DRE - Demonstração do Resultado do Exercício' },
          { path: '/api/admin/rankings/teachers', method: 'GET', description: 'Ranking de professores' },
          { path: '/api/admin/reports/usage', method: 'GET', description: 'Relatório de uso' },
          { path: '/api/admin/accesses', method: 'GET', description: 'Listar acessos' }
        ];
        
        let inserted = 0;
        for (const route of routesToInsert) {
          const existing = await AppDataSource.query(
            `SELECT id FROM rotas WHERE path = $1 AND method = $2`,
            [route.path, route.method]
          );
          
          if (existing.length === 0) {
            await AppDataSource.query(
              `INSERT INTO rotas (path, method, description) VALUES ($1, $2, $3)`,
              [route.path, route.method, route.description]
            );
            inserted++;
          }
        }
        
        console.log(`✅ ${inserted} rotas inseridas (${routesToInsert.length - inserted} já existiam)`);
      } catch (error: any) {
        console.error(`❌ Erro ao inserir rotas:`, error.message);
        throw error;
      }
    }

    // Busca os IDs das rotas de admin recém-inseridas
    console.log('🔍 Buscando IDs das rotas de admin...');
    const adminRoutes = await AppDataSource.query(
      "SELECT id, path, method FROM rotas WHERE path LIKE '/api/admin/%' ORDER BY id"
    );
    
    console.log(`✅ Encontradas ${adminRoutes.length} rotas de admin`);
    
    if (adminRoutes.length === 0) {
      console.log('⚠️  Nenhuma rota de admin encontrada. Verifique se o primeiro INSERT foi executado corretamente.');
      await AppDataSource.destroy();
      return;
    }

    // Insere permissões verificando antes se já existem
    let permissionsInserted = 0;
    for (const route of adminRoutes) {
      for (const role of ['admin', 'parent', 'teacher'] as const) {
        const allowed = role === 'admin';
        
        // Verifica se já existe
        const existing = await AppDataSource.query(
          `SELECT id FROM rotas_permissões WHERE rota_id = $1 AND role = $2`,
          [route.id, role]
        );
        
        if (existing.length === 0) {
          await AppDataSource.query(
            `INSERT INTO rotas_permissões (rota_id, role, allowed) VALUES ($1, $2, $3)`,
            [route.id, role, allowed]
          );
          permissionsInserted++;
        } else {
          // Atualiza se já existe
          await AppDataSource.query(
            `UPDATE rotas_permissões SET allowed = $1 WHERE rota_id = $2 AND role = $3`,
            [allowed, route.id, role]
          );
        }
      }
    }
    
    console.log(`✅ ${permissionsInserted} permissões inseridas/atualizadas para ${adminRoutes.length} rotas`);

    console.log('✅ Migração executada com sucesso!');
    console.log('📊 Verificando rotas inseridas...');

    const routesCount = await AppDataSource.query(
      "SELECT COUNT(*) as count FROM rotas WHERE path LIKE '/api/admin/%'"
    );
    console.log(`✅ ${routesCount[0].count} rotas de admin encontradas`);

    const permissionsCount = await AppDataSource.query(
      "SELECT COUNT(*) as count FROM rotas_permissões WHERE rota_id >= 35 AND role = 'admin'"
    );
    console.log(`✅ ${permissionsCount[0].count} permissões de admin encontradas`);

    await AppDataSource.destroy();
    console.log('✅ Conexão fechada');
  } catch (error) {
    console.error('❌ Erro ao executar migração:', error);
    process.exit(1);
  }
}

runMigration();

