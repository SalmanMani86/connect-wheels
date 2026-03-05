import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Post } from './post';

@Entity('post_comments')
export class PostComment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  postId!: number;

  @Column()
  userId!: number;

  @Column({ nullable: true })
  parentCommentId!: number | null;

  @Column({ type: 'text' })
  content!: string;

  @Column({ default: 0 })
  likesCount!: number;

  @Column({ default: 0 })
  repliesCount!: number;

  @Column({ default: false })
  isEdited!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post!: Post;

  @ManyToOne(() => PostComment, (c) => c.replies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentCommentId' })
  parent!: PostComment;

  @OneToMany(() => PostComment, (c) => c.parent)
  replies!: PostComment[];
}
