import 'reflect-metadata';
// IMPORTANTE: Carregar dotenv ANTES de qualquer import que use process.env
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env') });

import express from 'express';
import cors, { CorsOptions } from 'cors';
import { Client } from 'pg';
import { AppDataSource } from './config/database';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import contentRoutes from './routes/content.routes';
import marketplaceRoutes from './routes/marketplace.routes';
import familyRoutes from './routes/family.routes';
import analyticsRoutes from './routes/analytics.routes';
import adminRoutes from './routes/admin.routes';

// dotenv já foi carregado no topo do arquivo

// Log das configurações de DB (apenas em desenvolvimento)
if (process.env.NODE_ENV === 'development') {
  console.log('📋 Configurações de DB:');
  console.log('   Host:', process.env.DB_HOST || 'localhost');
  console.log('   Port:', process.env.DB_PORT || '5432');
  console.log('   Username:', process.env.DB_USERNAME || 'postgres');
  console.log('   Database:', process.env.DB_DATABASE || 'edumagico');
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
// Configuração de CORS
const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (process.env.NODE_ENV === 'production') {
      const allowedOrigins = process.env.CORS_ORIGIN 
        ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
        : [];
      
      // Se não há origem definida ou a origem da requisição está na lista permitida
      if (allowedOrigins.length === 0 || (origin && allowedOrigins.includes(origin))) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      // Em desenvolvimento, permite qualquer origem
      callback(null, true);
    }
  },
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);

// Função para preencher campos NULL com valores padrão
async function fillNullFields(client: Client, tableName: string, columnName: string, defaultValue: string) {
  try {
    // Verifica se a tabela existe
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )
    `, [tableName]);
    
    if (!tableExists.rows[0].exists) {
      return 0;
    }
    
    // Verifica se a coluna existe
    const columnExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = $1
        AND column_name = $2
      )
    `, [tableName, columnName]);
    
    if (!columnExists.rows[0].exists) {
      return 0;
    }
    
    const nullCount = await client.query(`
      SELECT COUNT(*) as count 
      FROM ${tableName} 
      WHERE ${columnName} IS NULL
    `);
    
    const count = parseInt(nullCount.rows[0].count);
    if (count > 0) {
      await client.query(`
        UPDATE ${tableName} 
        SET ${columnName} = ${defaultValue}
        WHERE ${columnName} IS NULL
      `);
      console.log(`  ✅ ${tableName}.${columnName}: ${count} valor(es) NULL preenchido(s)`);
      return count;
    }
    return 0;
  } catch (error: any) {
    // Ignora erros (pode ser que a coluna não exista ainda ou tenha constraints)
    return 0;
  }
}

// Função para corrigir dados antes da sincronização
async function fixDatabaseBeforeSync() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'edumagico',
  });

  try {
    await client.connect();
    console.log('🔧 Conectado ao banco para corrigir dados...');
    
    // 1. Preenche campos NULL em todas as tabelas principais
    console.log('📋 Verificando e preenchendo campos NULL...');
    
    // Tabela: users
    await fillNullFields(client, 'users', 'role', "'parent'::users_role_enum");
    await fillNullFields(client, 'users', 'plan', "'basic'::users_plan_enum");
    await fillNullFields(client, 'users', 'coins', '0');
    await fillNullFields(client, 'users', 'name', "'Usuário'");
    await fillNullFields(client, 'users', 'email', "'usuario@exemplo.com'");
    await fillNullFields(client, 'users', 'password', "'$2a$10$dummyhash'");
    
    // Tabela: rotas_permissões
    const tableResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'rotas_permissões'
      )
    `);
    
    if (tableResult.rows[0].exists) {
      // Verifica o tipo atual da coluna role
      const columnInfo = await client.query(`
        SELECT data_type, is_nullable, udt_name
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'rotas_permissões' 
        AND column_name = 'role'
      `);
      
      if (columnInfo.rows.length > 0) {
        const currentType = columnInfo.rows[0].data_type;
        const isNullable = columnInfo.rows[0].is_nullable === 'YES';
        const udtName = columnInfo.rows[0].udt_name;
        
        console.log(`📋 Tipo atual da coluna role: ${currentType} (nullable: ${isNullable})`);
        
        // Se a coluna é character varying ou text, precisa converter para enum
        if (currentType === 'character varying' || currentType === 'text') {
          console.log(`🔄 Convertendo coluna role de ${currentType} para enum...`);
          
          // 1. Garante que não há valores NULL ou inválidos
          await fillNullFields(client, 'rotas_permissões', 'role', "'parent'");
          
          await client.query(`
            UPDATE rotas_permissões 
            SET role = 'parent' 
            WHERE role NOT IN ('parent', 'teacher', 'admin')
          `);
          
          // 2. Remove o tipo enum antigo se existir e cria novo
          await client.query(`
            DROP TYPE IF EXISTS rotas_permissões_role_enum CASCADE;
          `);
          
          await client.query(`
            CREATE TYPE rotas_permissões_role_enum AS ENUM('parent', 'teacher', 'admin');
          `);
          
          // 3. Remove todas as constraints que usam a coluna role
          const constraints = await client.query(`
            SELECT constraint_name
            FROM information_schema.table_constraints
            WHERE table_schema = 'public'
            AND table_name = 'rotas_permissões'
            AND constraint_name LIKE '%role%'
          `);
          
          for (const constraint of constraints.rows) {
            try {
              await client.query(`
                ALTER TABLE rotas_permissões 
                DROP CONSTRAINT IF EXISTS ${constraint.constraint_name} CASCADE
              `);
            } catch (e) {
              // Ignora erros
            }
          }
          
          // 4. Adiciona coluna temporária com enum
          await client.query(`
            ALTER TABLE rotas_permissões 
            ADD COLUMN role_temp rotas_permissões_role_enum
          `);
          
          // 5. Copia dados validados para a coluna temporária (preenche NULL também)
          await client.query(`
            UPDATE rotas_permissões 
            SET role_temp = COALESCE(
              CASE 
                WHEN role::text = 'parent' THEN 'parent'::rotas_permissões_role_enum
                WHEN role::text = 'teacher' THEN 'teacher'::rotas_permissões_role_enum
                WHEN role::text = 'admin' THEN 'admin'::rotas_permissões_role_enum
                ELSE NULL
              END,
              'parent'::rotas_permissões_role_enum
            )
          `);
          
          // 6. Remove coluna antiga e renomeia a nova
          await client.query(`
            ALTER TABLE rotas_permissões 
            DROP COLUMN role
          `);
          
          await client.query(`
            ALTER TABLE rotas_permissões 
            RENAME COLUMN role_temp TO role
          `);
          
          // 7. Define NOT NULL
          await client.query(`
            ALTER TABLE rotas_permissões 
            ALTER COLUMN role SET NOT NULL
          `);
          
          console.log('✅ Coluna role convertida para enum com sucesso');
        } else if (currentType.includes('enum') || udtName === 'rotas_permissões_role_enum') {
          // Já é enum, apenas garante que não há NULL e define NOT NULL
          await fillNullFields(client, 'rotas_permissões', 'role', "'parent'::rotas_permissões_role_enum");
          
          // Verifica se é nullable e define NOT NULL se necessário
          if (isNullable) {
            await client.query(`
              ALTER TABLE rotas_permissões 
              ALTER COLUMN role SET NOT NULL
            `);
            console.log('✅ Coluna role definida como NOT NULL');
          }
        }
      }
      
      // Preenche outros campos NULL na tabela rotas_permissões
      await fillNullFields(client, 'rotas_permissões', 'allowed', 'true');
      await fillNullFields(client, 'rotas_permissões', 'rota_id', '1');
    }
    
    // Preenche campos NULL em outras tabelas
    console.log('📋 Preenchendo campos NULL em outras tabelas...');
    
    // Tabela: rotas - tratamento especial para evitar erro de DROP/ADD do TypeORM
    // O TypeORM pode tentar fazer DROP COLUMN e ADD COLUMN, mas quando faz ADD com NOT NULL
    // em uma tabela com registros, precisa de um valor padrão
    const rotasTableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'rotas'
      )
    `);
    
    if (rotasTableExists.rows[0].exists) {
      const recordCount = await client.query('SELECT COUNT(*) as count FROM rotas');
      const count = parseInt(recordCount.rows[0].count);
      
      // Se há registros, garante que as colunas path e method existam e tenham valores
      // Isso evita que o TypeORM tente fazer ADD COLUMN NOT NULL em tabela com dados
      if (count > 0) {
        const columns = await client.query(`
          SELECT column_name
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'rotas'
        `);
        
        const hasPath = columns.rows.some((r: any) => r.column_name === 'path');
        const hasMethod = columns.rows.some((r: any) => r.column_name === 'method');
        
        // Se path não existe, cria com valor padrão para todos os registros
        if (!hasPath) {
          await client.query(`
            ALTER TABLE rotas 
            ADD COLUMN path character varying NOT NULL DEFAULT '/api/unknown'
          `);
          // Remove o DEFAULT depois de preencher
          await client.query(`
            ALTER TABLE rotas 
            ALTER COLUMN path DROP DEFAULT
          `);
          console.log('  ✅ Coluna path criada com valores padrão na tabela rotas');
        } else {
          // Preenche NULL se houver
          await fillNullFields(client, 'rotas', 'path', "'/api/unknown'");
          // Garante NOT NULL
          try {
            await client.query(`
              ALTER TABLE rotas 
              ALTER COLUMN path SET NOT NULL
            `);
          } catch (e) {
            // Ignora se já for NOT NULL
          }
        }
        
        // Mesma coisa para method
        if (!hasMethod) {
          await client.query(`
            ALTER TABLE rotas 
            ADD COLUMN method character varying NOT NULL DEFAULT 'GET'
          `);
          await client.query(`
            ALTER TABLE rotas 
            ALTER COLUMN method DROP DEFAULT
          `);
          console.log('  ✅ Coluna method criada com valores padrão na tabela rotas');
        } else {
          await fillNullFields(client, 'rotas', 'method', "'GET'");
          try {
            await client.query(`
              ALTER TABLE rotas 
              ALTER COLUMN method SET NOT NULL
            `);
          } catch (e) {
            // Ignora se já for NOT NULL
          }
        }
      } else {
        // Se não há registros, apenas preenche NULL se houver
        await fillNullFields(client, 'rotas', 'path', "'/api/unknown'");
        await fillNullFields(client, 'rotas', 'method', "'GET'");
      }
    }
    
    // Tabela: content_items
    await fillNullFields(client, 'content_items', 'price', '0.00');
    await fillNullFields(client, 'content_items', 'salesCount', '0');
    await fillNullFields(client, 'content_items', 'isAiGenerated', 'false');
    
    // Tabela: child_profiles
    await fillNullFields(client, 'child_profiles', 'points', '0');
    
    // Tabela: purchases
    await fillNullFields(client, 'purchases', 'coinsUsed', '0');
    await fillNullFields(client, 'purchases', 'status', "'completed'");
    
    // Tabela: activity_history
    await fillNullFields(client, 'activity_history', 'score', '0');
    await fillNullFields(client, 'activity_history', 'maxScore', '100');
    
    // Tabela: user_accesses
    await fillNullFields(client, 'user_accesses', 'sessionDuration', '0');
    await fillNullFields(client, 'user_accesses', 'loginAt', "'2024-01-01 00:00:00'::timestamp");
    
    // Tabela: notifications
    await fillNullFields(client, 'notifications', 'targetType', "'all'::notifications_targettype_enum");
    await fillNullFields(client, 'notifications', 'title', "'Notificação'");
    await fillNullFields(client, 'notifications', 'message', "'Mensagem padrão'");
    await fillNullFields(client, 'notifications', 'type', "'info'::notifications_type_enum");
    await fillNullFields(client, 'notifications', 'isRead', 'false');
    
    // Tabela: financial_transactions
    await fillNullFields(client, 'financial_transactions', 'type', "'income'::financial_transactions_type_enum");
    await fillNullFields(client, 'financial_transactions', 'category', "'other'::financial_transactions_category_enum");
    await fillNullFields(client, 'financial_transactions', 'amount', '0.00');
    await fillNullFields(client, 'financial_transactions', 'description', "'Transação padrão'");
    await fillNullFields(client, 'financial_transactions', 'status', "'pending'::financial_transactions_status_enum");
    
    // Tabela: teacher_ratings
    await fillNullFields(client, 'teacher_ratings', 'raterType', "'parent'::teacher_ratings_ratertype_enum");
    await fillNullFields(client, 'teacher_ratings', 'rating', '3');
    
    console.log('✅ Correção de campos NULL concluída');
    
  } catch (error: any) {
    // Se der erro, tenta continuar mesmo assim (pode ser que a tabela não exista ainda)
    console.log('⚠️ Aviso ao corrigir dados (pode ser normal se as tabelas ainda não existem):', error.message);
  } finally {
    await client.end();
  }
}

// Initialize database
async function startServer() {
  try {
    // Primeiro, corrige os dados se necessário
    await fixDatabaseBeforeSync();
    
    // Conecta ao banco ANTES de inicializar o TypeORM para garantir que as colunas estejam corretas
    const preClient = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'edumagico',
    });
    
    try {
      await preClient.connect();
      
      // Verifica se a tabela rotas existe e tem registros
      const rotasCheck = await preClient.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'rotas'
        ) as exists,
        (SELECT COUNT(*) FROM rotas) as count
      `);
      
      if (rotasCheck.rows[0].exists && parseInt(rotasCheck.rows[0].count) > 0) {
        // Verifica se path existe
        const pathCheck = await preClient.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'rotas' 
            AND column_name = 'path'
          )
        `);
        
        // Se não existe, cria com DEFAULT para evitar erro do TypeORM
        if (!pathCheck.rows[0].exists) {
          await preClient.query(`
            ALTER TABLE rotas 
            ADD COLUMN path character varying NOT NULL DEFAULT '/api/unknown'
          `);
          await preClient.query(`
            ALTER TABLE rotas 
            ALTER COLUMN path DROP DEFAULT
          `);
          console.log('  ✅ Coluna path criada preventivamente');
        }
        
        // Mesma coisa para method
        const methodCheck = await preClient.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'rotas' 
            AND column_name = 'method'
          )
        `);
        
        if (!methodCheck.rows[0].exists) {
          await preClient.query(`
            ALTER TABLE rotas 
            ADD COLUMN method character varying NOT NULL DEFAULT 'GET'
          `);
          await preClient.query(`
            ALTER TABLE rotas 
            ALTER COLUMN method DROP DEFAULT
          `);
          console.log('  ✅ Coluna method criada preventivamente');
        }
      }
      
      await preClient.end();
    } catch (preError: any) {
      // Ignora erros na verificação preventiva
      console.log('⚠️ Aviso na verificação preventiva:', preError.message);
      await preClient.end();
    }
    
    // Agora inicializa o AppDataSource com tratamento de erro
    try {
      await AppDataSource.initialize();
      console.log('✅ Database connected successfully');
    } catch (syncError: any) {
      // Se o erro for relacionado a DROP/ADD COLUMN na tabela rotas, corrige e tenta novamente
      if (syncError.message && syncError.message.includes('rotas') && syncError.message.includes('contains null values')) {
        console.log('⚠️ Erro de sincronização detectado, corrigindo schema...');
        
        const fixClient = new Client({
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432'),
          user: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD || '',
          database: process.env.DB_DATABASE || 'edumagico',
        });
        
        try {
          await fixClient.connect();
          
          // Verifica se path existe
          const pathCheck = await fixClient.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'rotas' 
              AND column_name = 'path'
            )
          `);
          
          if (!pathCheck.rows[0].exists) {
            // Cria com DEFAULT
            await fixClient.query(`
              ALTER TABLE rotas 
              ADD COLUMN path character varying NOT NULL DEFAULT '/api/unknown'
            `);
            await fixClient.query(`
              ALTER TABLE rotas 
              ALTER COLUMN path DROP DEFAULT
            `);
            console.log('  ✅ Coluna path criada com DEFAULT');
          }
          
          // Mesma coisa para method
          const methodCheck = await fixClient.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'rotas' 
              AND column_name = 'method'
            )
          `);
          
          if (!methodCheck.rows[0].exists) {
            await fixClient.query(`
              ALTER TABLE rotas 
              ADD COLUMN method character varying NOT NULL DEFAULT 'GET'
            `);
            await fixClient.query(`
              ALTER TABLE rotas 
              ALTER COLUMN method DROP DEFAULT
            `);
            console.log('  ✅ Coluna method criada com DEFAULT');
          }
          
          await fixClient.end();
          
          // Tenta inicializar novamente
          await AppDataSource.initialize();
          console.log('✅ Database connected successfully após correção');
        } catch (fixError: any) {
          await fixClient.end();
          throw syncError; // Re-lança o erro original
        }
      } else {
        throw syncError; // Re-lança o erro se não for o esperado
      }
    }
    
    const port = typeof PORT === 'string' ? parseInt(PORT, 10) : PORT;
    app.listen(port, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${port}`);
      console.log(`🌐 Accessible at: http://localhost:${port}`);
    });
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
}

startServer();

export default app;

