import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './User';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true })
  userId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ type: 'enum', enum: ['all', 'parents', 'teachers', 'students', 'specific'] })
  targetType: 'all' | 'parents' | 'teachers' | 'students' | 'specific';

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'enum', enum: ['info', 'success', 'warning', 'error'], default: 'info' })
  type: 'info' | 'success' | 'warning' | 'error';

  @Column({ default: false })
  isRead: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    link?: string;
    action?: string;
    [key: string]: any;
  };

  @Column({ name: 'created_by', nullable: true })
  createdBy?: string;

  @CreateDateColumn()
  createdAt: Date;
}

