import { DataSource } from 'typeorm';
import { User } from '../entities/User';
import { ContentItem } from '../entities/ContentItem';
import { ChildProfile } from '../entities/ChildProfile';
import { ActivityHistory } from '../entities/ActivityHistory';
import { Purchase } from '../entities/Purchase';
import { Route } from '../entities/Route';
import { RoutePermission } from '../entities/RoutePermission';

// SQLite version for development (no PostgreSQL required)
export const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: './edumagico.db',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [
    User,
    ContentItem,
    ChildProfile,
    ActivityHistory,
    Purchase,
    Route,
    RoutePermission
  ],
  migrations: ['src/migrations/**/*.ts'],
  subscribers: ['src/subscribers/**/*.ts'],
});

