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

  @Column()
  password!: string;

  @Column({ unique: true, length: 100 })
  email!: string;

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