import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Post } from './post';

@Entity('post_media')
export class PostMedia {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  postId!: number;

  @Column()
  mediaUrl!: string;

  @Column({ default: 'image' })
  mediaType!: string;

  @Column({ nullable: true })
  thumbnailUrl!: string;

  @Column({ default: 0 })
  displayOrder!: number;

  @Column({ type: 'int', nullable: true })
  width!: number;

  @Column({ type: 'int', nullable: true })
  height!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post!: Post;
}
