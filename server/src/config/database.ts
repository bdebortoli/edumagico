// Carrega dotenv primeiro para garantir que as variáveis estejam disponíveis
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { DataSource } from 'typeorm';
import { User } from '../entities/User';
import { ContentItem } from '../entities/ContentItem';
import { ChildProfile } from '../entities/ChildProfile';
import { ActivityHistory } from '../entities/ActivityHistory';
import { Purchase } from '../entities/Purchase';
import { Route } from '../entities/Route';
import { RoutePermission } from '../entities/RoutePermission';
import { UserAccess } from '../entities/UserAccess';
import { Notification } from '../entities/Notification';
import { FinancialTransaction } from '../entities/FinancialTransaction';
import { TeacherRating } from '../entities/TeacherRating';
import { Invoice } from '../entities/Invoice';

// Garante que as variáveis de ambiente estão carregadas
// Força o uso das variáveis de ambiente, sem fallback para 'postgres'
const dbUsername = process.env.DB_USERNAME;
if (!dbUsername) {
  console.error('❌ DB_USERNAME não está definido no .env!');
  process.exit(1);
}

const dbConfig = {
  type: 'postgres' as const,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: dbUsername, // Usa exatamente o que está no .env
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'edumagico',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

// Log da configuração que será usada (apenas em desenvolvimento)
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 TypeORM usando configuração:');
  console.log('   Username:', dbConfig.username);
  console.log('   Host:', dbConfig.host);
  console.log('   Database:', dbConfig.database);
  console.log('   DB_USERNAME do env:', process.env.DB_USERNAME);
}

export const AppDataSource = new DataSource({
  ...dbConfig,
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [
    User,
    ContentItem,
    ChildProfile,
    ActivityHistory,
    Purchase,
    Route,
    RoutePermission,
    UserAccess,
    Notification,
    FinancialTransaction,
    TeacherRating,
    Invoice
  ],
  migrations: ['src/migrations/**/*.ts'],
  subscribers: ['src/subscribers/**/*.ts'],
});

