import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { PackagingStatus } from "../enums/PackagingStatus";
import { Perfume } from "./Perfume";

@Entity("packaging")
export class Packaging {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Perfume, { onDelete: "CASCADE" })
  @JoinColumn({ name: "perfume_id" })
  perfume!: Perfume;

  @Column({ name: "perfume_id" })
  perfumeId!: number;

  @Column({ type: "int" })
  quantity!: number;

  @Column({ 
    type: "enum",
    enum: PackagingStatus,
    default: PackagingStatus.AVAILABLE
  })
  status!: PackagingStatus;

  @Column({ type: "varchar", length: 100, nullable: true, name: "warehouse_location" })
  warehouseLocation?: string;

  @Column({ type: "varchar", length: 255, nullable: true, name: "tracking_number" })
  trackingNumber?: string;

  @Column({ type: "json", nullable: true })
  details?: Record<string, any>;

  @CreateDateColumn({ name: "packaged_at" })
  packagedAt!: Date;

  @Column({ type: "timestamp", nullable: true, name: "shipped_at" })
  shippedAt?: Date;

  @Column({ type: "timestamp", nullable: true, name: "received_at" })
  receivedAt?: Date;

  // Mark as shipped to warehouse
  markAsShipped(warehouseLocation: string, trackingNumber?: string): void {
    this.status = PackagingStatus.SHIPPED;
    this.warehouseLocation = warehouseLocation;
    this.trackingNumber = trackingNumber;
    this.shippedAt = new Date();
  }

  // Mark as delivered to warehouse
  markAsDelivered(): void {
    this.status = PackagingStatus.DELIVERED;
    this.receivedAt = new Date();
  }

  // Check if available for shipping
  isAvailable(): boolean {
    return this.status === PackagingStatus.AVAILABLE;
  }

  // Check if already shipped
  isShipped(): boolean {
    return this.status === PackagingStatus.SHIPPED;
  }

  // Get total volume in ml (requires perfume relation)
  getTotalVolume(): number | null {
    if (!this.perfume) return null;
    return this.quantity * this.perfume.bottleSize;
  }
}