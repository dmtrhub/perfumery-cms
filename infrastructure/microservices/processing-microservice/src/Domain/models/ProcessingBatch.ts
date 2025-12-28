import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { ProcessingStatus } from "../enums/ProcessingStatus";
import { SourceType } from "../enums/SourceType";
import { Perfume } from "./Perfume";

@Entity("processing_batches")
export class ProcessingBatch {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Perfume, { onDelete: "CASCADE" })
  @JoinColumn({ name: "perfume_id" })
  perfume!: Perfume;

  @Column({ name: "perfume_id" })
  perfumeId!: number;

  @Column({ type: "int", name: "bottle_count" })
  bottleCount!: number;

  @Column({ type: "int", name: "plants_needed" })
  plantsNeeded!: number;

  @Column({ 
    type: "enum",
    enum: ProcessingStatus,
    default: ProcessingStatus.PENDING
  })
  status!: ProcessingStatus;

  @Column({ 
    type: "enum",
    enum: SourceType,
    default: SourceType.CLIENT
  })
  source!: SourceType;

  @Column({ type: "varchar", length: 255, nullable: true, name: "request_id" })
  requestId?: string;

  @Column({ type: "int", nullable: true, name: "user_id" })
  userId?: number;

  @Column({ type: "json", nullable: true })
  details?: Record<string, any>;

  @CreateDateColumn({ name: "started_at" })
  startedAt!: Date;

  @Column({ type: "timestamp", nullable: true, name: "completed_at" })
  completedAt?: Date;

  @Column({ type: "varchar", length: 500, nullable: true, name: "failure_reason" })
  failureReason?: string;

  @Column({ nullable: true })
  plantId?: number; // ID biljke korišćene za obradu

  @Column({ nullable: true })
  oilIntensity?: number;

  // Mark batch as completed
  markAsCompleted(): void {
    this.status = ProcessingStatus.COMPLETED;
    this.completedAt = new Date();
  }

  // Mark batch as failed
  markAsFailed(reason: string): void {
    this.status = ProcessingStatus.FAILED;
    this.failureReason = reason;
    this.completedAt = new Date();
  }

  // Mark batch as cancelled
  markAsCancelled(reason?: string): void {
    this.status = ProcessingStatus.CANCELLED;
    this.failureReason = reason || "Cancelled by user";
    this.completedAt = new Date();
  }

  // Check if batch is in progress
  isInProgress(): boolean {
    return this.status === ProcessingStatus.PROCESSING;
  }

  // Check if batch is completed
  isCompleted(): boolean {
    return this.status === ProcessingStatus.COMPLETED;
  }
}