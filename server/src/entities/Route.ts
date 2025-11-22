import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { RoutePermission } from './RoutePermission';

@Entity('rotas')
export class Route {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ default: '/api/unknown' })
  path: string; // Ex: /api/content

  @Column({ default: 'GET' })
  method: string; // GET, POST, PUT, DELETE

  @Column({ nullable: true })
  description?: string;

  @OneToMany(() => RoutePermission, permission => permission.route)
  permissions: RoutePermission[];

  @CreateDateColumn()
  createdAt: Date;
}

