import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User';

@Entity('teacher_ratings')
export class TeacherRating {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'teacher_id' })
  teacherId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'teacher_id' })
  teacher: User;

  @Column({ name: 'rater_id' })
  raterId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'rater_id' })
  rater: User;

  @Column({ type: 'enum', enum: ['parent', 'student'] })
  raterType: 'parent' | 'student';

  @Column({ type: 'int' })
  rating: number; // 1 a 5

  @Column({ type: 'text', nullable: true })
  comment?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

