import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";
import { ProcessingStatus } from "../enums/ProcessingStatus";
import { PerfumeType } from "../enums/PerfumeType";
import { BottleSize } from "../enums/BottleSize";

@Entity("processing_requests")
export class ProcessingRequest {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ 
    type: "enum",
    enum: PerfumeType,
    name: "perfume_type"
  })
  perfumeType!: PerfumeType;

  @Column({ 
    type: "enum",
    enum: BottleSize,
    name: "bottle_size"
  })
  bottleSize!: BottleSize;

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

  @Column({ type: "varchar", length: 100, nullable: true, name: "request_source" })
  requestSource?: string;

  @Column({ type: "int", nullable: true, name: "user_id" })
  userId?: number;

  @Column({ type: "varchar", length: 255, nullable: true, name: "external_request_id" })
  externalRequestId?: string;

  @Column({ type: "json", nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @Column({ type: "timestamp", nullable: true, name: "processed_at" })
  processedAt?: Date;

  @Column({ type: "varchar", length: 500, nullable: true })
  notes?: string;

  // Calculate total volume in ml
  getTotalVolume(): number {
    return this.bottleCount * this.bottleSize;
  }

  // Mark request as processed
  markAsProcessed(): void {
    this.status = ProcessingStatus.COMPLETED;
    this.processedAt = new Date();
  }

  // Mark request as failed
  markAsFailed(reason: string): void {
    this.status = ProcessingStatus.FAILED;
    this.notes = reason;
  }

  // Check if request is pending
  isPending(): boolean {
    return this.status === ProcessingStatus.PENDING;
  }
}