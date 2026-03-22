import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("app_user")
export class User {
  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Column({ nullable: true })
  firstName!: string;

  @Column({ nullable: true })
  lastName!: string;

  @Column({ nullable: true, unique: true })
  email!: string;

  @Column({ nullable: true })
  password!: string;

  @Column({ nullable: true })
  googleId!: string;

  @Column({ nullable: true })
  googleRefreshToken!: string;
  @Column({ default: 'user' })
  role!: string;

  @Column({ default: false })
  isEmailVerified!: boolean;

  @Column({ type: "varchar", length: 255, nullable: true })
  emailVerificationToken!: string | null;

  @Column({ type: "timestamptz", nullable: true })
  emailVerificationTokenExpiresAt!: Date | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  resetPasswordToken!: string | null;

  @Column({ type: "timestamptz", nullable: true })
  resetPasswordTokenExpiresAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
