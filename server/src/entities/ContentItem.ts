import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User';

export type ContentType = 'story' | 'quiz' | 'summary' | 'game';

@Entity('content_items')
export class ContentItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: ['story', 'quiz', 'summary', 'game'] })
  type: ContentType;

  @Column({ name: 'author_id' })
  authorId: string;

  @ManyToOne(() => User, user => user.contents)
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column()
  authorName: string;

  @Column({ type: 'enum', enum: ['parent', 'teacher'] })
  authorRole: 'parent' | 'teacher';

  @Column()
  subject: string;

  @Column({ type: 'jsonb' })
  ageRange: { min: number; max: number };

  @Column({ nullable: true })
  grade?: string;

  @Column({ type: 'simple-array', nullable: true })
  keywords?: string[];

  @Column({ type: 'jsonb', nullable: true })
  resources?: {
    videoUrl?: string;
    audioUrl?: string;
    externalLink?: string;
  };

  @Column({ default: false })
  isAiGenerated: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ type: 'int', default: 0 })
  salesCount: number;

  @Column({ type: 'jsonb' })
  data: any; // StoryData | QuizData | SummaryData

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

