import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './User';

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, user => user.invoices)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: ['subscription', 'purchase', 'refund'], default: 'subscription' })
  type: 'subscription' | 'purchase' | 'refund';

  @Column({ type: 'enum', enum: ['credit_card', 'debit_card', 'pix', 'boleto', 'bank_transfer'], nullable: true })
  paymentMethod?: 'credit_card' | 'debit_card' | 'pix' | 'boleto' | 'bank_transfer';

  @Column({ type: 'date' })
  dueDate: Date;

  @Column({ type: 'date', nullable: true })
  paidAt?: Date;

  @Column({ type: 'enum', enum: ['pending', 'paid', 'overdue', 'cancelled'], default: 'pending' })
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    subscriptionId?: string;
    purchaseId?: string;
    transactionId?: string;
    [key: string]: any;
  };

  @CreateDateColumn()
  createdAt: Date;
}

