import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Warehouse } from "./Warehouse";
import { PackagingStatus } from "../enums/PackagingStatus";

@Entity("storage_packaging")
export class StoragePackaging {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "int", unique: true })
  processingPackagingId!: number; // ID from Processing Microservice

  @Column({ type: "json" })
  perfumeIds!: number[]; // List of perfume IDs contained in this packaging

  @Column({ 
    type: "enum", 
    enum: PackagingStatus, 
    default: PackagingStatus.IN_STORAGE 
  })
  status!: PackagingStatus;

  @Column({ type: "varchar", length: 255, nullable: true })
  trackingNumber?: string;

  @ManyToOne(() => Warehouse, (warehouse) => warehouse.packages)
  @JoinColumn({ name: "warehouse_id" })
  warehouse!: Warehouse;

  @Column()
  warehouse_id!: number;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  receivedAt!: Date;

  @Column({ type: "timestamp", nullable: true })
  shippedAt?: Date;

  // Helper metode
  isAvailable(): boolean {
    return this.status === PackagingStatus.IN_STORAGE;
  }

  markAsShipped(trackingNumber?: string): void {
    this.status = PackagingStatus.SHIPPED;
    this.trackingNumber = trackingNumber;
    this.shippedAt = new Date();
  }
}