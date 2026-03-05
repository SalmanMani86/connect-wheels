import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Car } from './car';
import { UserGarageFollow } from './user-garage-follow';

@Entity('garages')
export class Garage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ nullable: true })
  pictureUrl!: string;

  @Column({ nullable: true })
  coverImageUrl!: string;

  @Column({ nullable: true })
  location!: string;

  @Column()
  ownerId!: number;

  @Column({ default: 0 })
  followersCount!: number;

  @Column({ default: 0 })
  postsCount!: number;

  @Column({ default: 0 })
  carsCount!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => Car, (car) => car.garage)
  cars!: Car[];

  @OneToMany(() => UserGarageFollow, (follow) => follow.garage)
  followers!: UserGarageFollow[];
}