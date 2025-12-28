import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { LogLevel } from "../enums/LogLevel";
import { AuditAction } from "../enums/AuditAction";
import { ServiceType } from "../enums/ServiceType";

@Entity("audit_logs")
export class AuditLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "enum", enum: ServiceType })
  service!: ServiceType;

  @Column({ type: "enum", enum: AuditAction })
  action!: AuditAction;

  @Column({ nullable: true })
  userId?: number;

  @Column({ nullable: true })
  userEmail?: string;

  @Column({ nullable: true })
  entityId?: string;

  @Column({ nullable: true })
  entityType?: string;

  @Column({ type: "enum", enum: LogLevel, default: LogLevel.INFO })
  logLevel!: LogLevel;

  @Column({ type: "text" })
  message!: string;

  @Column({ type: "json", nullable: true })
  details?: Record<string, any>;

  @Column({ nullable: true })
  ipAddress?: string;

  @Column({ type: "text", nullable: true })
  userAgent?: string;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  timestamp!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ default: true })
  successful!: boolean;

  @Column({ nullable: true })
  source?: string;
}