import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export type NotificationType = 'MESSAGE' | 'POST_LIKE' | 'POST_COMMENT' | 'GARAGE_FOLLOW';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number; // recipient

  @Column({ type: 'varchar', length: 50 })
  type!: NotificationType;

  @Column({ type: 'jsonb', nullable: true })
  data!: {
    actorUserId?: number;
    actorName?: string;
    postId?: number;
    postTitle?: string;
    garageId?: number;
    garageName?: string;
    commentId?: number;
    commentPreview?: string;
    chatId?: string;
  };

  @Column({ default: false })
  read!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
