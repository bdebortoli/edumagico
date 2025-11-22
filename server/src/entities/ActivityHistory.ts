import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './User';
import { ChildProfile } from './ChildProfile';
import { ContentItem } from './ContentItem';

@Entity('activity_history')
export class ActivityHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, user => user.activityHistory)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'child_id' })
  childId: string;

  @ManyToOne(() => ChildProfile, child => child.activityHistory)
  @JoinColumn({ name: 'child_id' })
  child: ChildProfile;

  @Column({ name: 'content_id' })
  contentId: string;

  @ManyToOne(() => ContentItem)
  @JoinColumn({ name: 'content_id' })
  content: ContentItem;

  @Column()
  contentTitle: string;

  @Column()
  subject: string;

  @Column({ type: 'int' })
  score: number; // 0 to 100

  @Column({ type: 'int' })
  maxScore: number;

  @CreateDateColumn({ name: 'completed_at' })
  completedAt: Date;
}

