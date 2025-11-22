import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ContentItem } from './ContentItem';
import { ChildProfile } from './ChildProfile';
import { ActivityHistory } from './ActivityHistory';
import { Purchase } from './Purchase';
import { Invoice } from './Invoice';

export type UserRole = 'parent' | 'teacher' | 'admin';
export type PlanType = 'basic' | 'premium';
export type SubscriptionCycle = 'monthly' | 'yearly';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string; // Hashed

  @Column({ type: 'enum', enum: ['parent', 'teacher', 'admin'], default: 'parent' })
  role: UserRole;

  @Column({ type: 'enum', enum: ['basic', 'premium'], default: 'basic' })
  plan: PlanType;

  @Column({ type: 'int', default: 0 })
  coins: number;

  @Column({ nullable: true })
  cpf?: string;

  @Column({ type: 'date', nullable: true })
  birthDate?: Date;

  @Column({ type: 'jsonb', nullable: true })
  address?: {
    street: string;
    number: string;
    complement?: string;
    city: string;
    state: string;
    zipCode: string;
  };

  @Column({ nullable: true })
  phoneNumber?: string;

  // Teacher specific
  @Column({ type: 'jsonb', nullable: true })
  teacherProfile?: {
    bio?: string;
    subjects: string[];
    bankDetails?: {
      bankName: string;
      accountType: 'checking' | 'savings';
      agency: string;
      accountNumber: string;
      pixKey?: string;
    };
    totalEarnings: number;
  };

  // Parent specific
  @Column({ type: 'jsonb', nullable: true })
  parentProfile?: {
    paymentMethods: Array<{
      last4: string;
      brand: string;
      token: string;
    }>;
  };

  // Subscription
  @Column({ type: 'jsonb', nullable: true })
  subscription?: {
    status: 'active' | 'inactive' | 'cancelled';
    cycle: SubscriptionCycle;
    nextBillingDate: Date;
    last4Digits?: string;
  };

  // Relations
  @OneToMany(() => ContentItem, content => content.author)
  contents: ContentItem[];

  @OneToMany(() => ChildProfile, child => child.parent)
  children: ChildProfile[];

  @OneToMany(() => ActivityHistory, history => history.user)
  activityHistory: ActivityHistory[];

  @OneToMany(() => Purchase, purchase => purchase.user)
  purchases: Purchase[];

  @OneToMany(() => Invoice, invoice => invoice.user)
  invoices: Invoice[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

