import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './User';

@Entity('financial_transactions')
export class FinancialTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true })
  userId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ type: 'enum', enum: ['income', 'expense'] })
  type: 'income' | 'expense';

  @Column({ type: 'enum', enum: ['subscription', 'content_sale', 'refund', 'payout', 'other'] })
  category: 'subscription' | 'content_sale' | 'refund' | 'payout' | 'other';

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column()
  description: string;

  @Column({ type: 'enum', enum: ['pending', 'completed', 'failed', 'cancelled'], default: 'pending' })
  status: 'pending' | 'completed' | 'failed' | 'cancelled';

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    subscriptionId?: string;
    contentId?: string;
    purchaseId?: string;
    paymentMethod?: string;
    [key: string]: any;
  };

  @CreateDateColumn()
  createdAt: Date;
}

