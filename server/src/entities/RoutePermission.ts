import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Route } from './Route';

@Entity('rotas_permissões')
export class RoutePermission {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'rota_id' })
  rotaId: number;

  @ManyToOne(() => Route, route => route.permissions)
  @JoinColumn({ name: 'rota_id' })
  route: Route;

  @Column({ type: 'enum', enum: ['parent', 'teacher', 'admin'] })
  role: 'parent' | 'teacher' | 'admin';

  @Column({ default: true })
  allowed: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

