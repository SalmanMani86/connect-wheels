import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Car } from './car';

@Entity('car_media')
export class CarMedia {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  carId!: number;

  @Column()
  mediaUrl!: string;

  @Column({ default: 'image' })
  mediaType!: string;

  @Column({ default: 0 })
  displayOrder!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Car, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'carId' })
  car!: Car;
}
