import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Garage } from './garage';
import { CarMedia } from './car-media';

@Entity('cars')
export class Car {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  garageId!: number;

  @Column()
  make!: string;

  @Column()
  model!: string;

  @Column()
  year!: number;

  @Column({ nullable: true })
  color!: string;

  @Column({ unique: true, nullable: true })
  vin!: string;

  @Column({ type: 'int', nullable: true })
  mileage!: number;

  @Column({ nullable: true })
  engineType!: string;

  @Column({ nullable: true })
  transmission!: string;

  @Column({ nullable: true })
  pictureUrl!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Garage, (garage) => garage.cars, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'garageId' })
  garage!: Garage;

  @OneToMany(() => CarMedia, (m) => m.car, { cascade: true })
  media!: CarMedia[];
}

