import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { PerfumeType } from "../enums/PerfumeType";
import { BottleSize } from "../enums/BottleSize";
import { ProcessingBatch } from "./ProcessingBatch";

@Entity("perfumes")
export class Perfume {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Column({ 
    type: "enum",
    enum: PerfumeType,
    name: "perfume_type"
  })
  type!: PerfumeType;

  @Column({ 
    type: "enum",
    enum: BottleSize,
    default: BottleSize.ML_150,
    name: "bottle_size"
  })
  bottleSize!: BottleSize;

  @Column({ type: "int", default: 0 })
  quantity!: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0, name: "total_volume_ml" })
  totalVolumeMl!: number;

  @Column({ type: "int", default: 0, name: "reserved_quantity" })
  reservedQuantity!: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @OneToMany(() => ProcessingBatch, batch => batch.perfume)
  batches!: ProcessingBatch[];

  // Calculate plants needed for production (1 plant = 50ml perfume)
  calculatePlantsNeeded(bottleCount: number): number {
    const totalMlNeeded = bottleCount * this.bottleSize;
    return Math.ceil(totalMlNeeded / 50);
  }

  // Add produced perfume to inventory
  addProduction(bottleCount: number): void {
    this.quantity += bottleCount;
    this.totalVolumeMl += bottleCount * this.bottleSize;
  }

  // Reserve perfume for packaging
  reserveForPackaging(quantity: number): boolean {
    if (this.quantity - this.reservedQuantity >= quantity) {
      this.reservedQuantity += quantity;
      return true;
    }
    return false;
  }

  // Release reserved perfume (when shipped to warehouse)
  releaseReserved(quantity: number): void {
    if (this.reservedQuantity >= quantity) {
      this.reservedQuantity -= quantity;
      this.quantity -= quantity;
      this.totalVolumeMl -= quantity * this.bottleSize;
    }
  }

  // Get available quantity (not reserved)
  getAvailableQuantity(): number {
    return this.quantity - this.reservedQuantity;
  }

  // Check if enough perfume is available
  hasEnoughQuantity(quantity: number): boolean {
    return this.getAvailableQuantity() >= quantity;
  }
}