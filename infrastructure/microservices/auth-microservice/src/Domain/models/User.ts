import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { UserRole } from "../enums/UserRole";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true, length: 30 })
  username!: string;

  @Column({ nullable: true })
  password?: string;

  @Column({ unique: true, length: 100 })
  email!: string;

  @Column({ nullable: true, length: 20 })
  oauthProvider?: string; // 'google' | 'github' | null

  @Column({ nullable: true, length: 255 })
  oauthId?: string; // Provider's unique user ID

  @Column({ length: 50 })
  firstName!: string;

  @Column({ length: 50 })
  lastName!: string;

  @Column({ type: "longtext", nullable: true })
  profilePicture?: string; // base64

  @Column({ type: "enum", enum: UserRole })
  role!: UserRole;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}