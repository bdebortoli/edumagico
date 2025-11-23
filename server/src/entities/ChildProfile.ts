import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User';
import { ActivityHistory } from './ActivityHistory';

@Entity('child_profiles')
export class ChildProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'date', nullable: true })
  birthDate?: Date;

  @Column({ type: 'int', nullable: true })
  age: number; // Mantido para compatibilidade, será calculado a partir de birthDate

  @Column()
  grade: string;

  @Column({ nullable: true })
  school?: string;

  @Column({ nullable: true })
  state?: string;

  @Column({ nullable: true })
  city?: string;

  @Column({ type: 'int', default: 0 })
  points: number;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ name: 'parent_id' })
  parentId: string;

  @ManyToOne(() => User, user => user.children)
  @JoinColumn({ name: 'parent_id' })
  parent: User;

  @OneToMany(() => ActivityHistory, history => history.child)
  activityHistory: ActivityHistory[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

