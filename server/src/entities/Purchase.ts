import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './User';
import { ContentItem } from './ContentItem';

@Entity('purchases')
export class Purchase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, user => user.purchases)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'content_id' })
  contentId: string;

  @ManyToOne(() => ContentItem)
  @JoinColumn({ name: 'content_id' })
  content: ContentItem;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'int', default: 0 })
  coinsUsed: number;

  @Column({ default: 'completed' })
  status: 'pending' | 'completed' | 'failed' | 'refunded';

  @CreateDateColumn()
  createdAt: Date;
}

