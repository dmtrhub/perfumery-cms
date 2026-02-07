import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index
} from "typeorm";
import { AuditLogType } from "../enums/AuditLogType";
import { ServiceType } from "../enums/ServiceType";

/**
 * AuditLog Entity
 * Predstavlja jedan zapis dogadjaja u sistemu
 */
@Entity("audit_logs")
@Index(["type"])
@Index(["serviceName"])
@Index(["timestamp"])
@Index(["userId"])
export class AuditLog {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "enum", enum: AuditLogType })
  type!: AuditLogType;

  @Column({ type: "enum", enum: ServiceType })
  serviceName!: ServiceType;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "uuid", nullable: true })
  userId?: string;

  @Column({ type: "varchar", length: 45, nullable: true })
  ipAddress?: string;

  @CreateDateColumn()
  timestamp!: Date;

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      serviceName: this.serviceName,
      description: this.description,
      userId: this.userId,
      ipAddress: this.ipAddress,
      timestamp: this.timestamp
    };
  }
}