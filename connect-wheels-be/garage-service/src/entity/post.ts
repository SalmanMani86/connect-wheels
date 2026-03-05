import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Garage } from './garage';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  garageId!: number;

  @Column({ nullable: true })
  title!: string;

  @Column({ type: 'text', nullable: true })
  caption!: string;

  @Column({ type: 'text', nullable: true })
  content!: string;

  @Column({ default: 0 })
  likesCount!: number;

  @Column({ default: 0 })
  commentsCount!: number;

  @Column({ default: 0 })
  sharesCount!: number;

  @Column({ default: 0 })
  viewsCount!: number;

  @Column({ default: true })
  isPublished!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Garage, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'garageId' })
  garage!: Garage;
}
