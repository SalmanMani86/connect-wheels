import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { PostComment } from './post-comment';

@Entity('comment_likes')
@Unique(['commentId', 'userId'])
export class CommentLike {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  commentId!: number;

  @Column()
  userId!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => PostComment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'commentId' })
  comment!: PostComment;
}
