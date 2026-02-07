import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn
} from "typeorm";
import { PerfumeType } from "../enums/PerfumeType";
import { PerfumeStatus } from "../enums/PerfumeStatus";
import { Packaging } from "./Packaging";

/**
 * Perfume Entity
 * Predstavlja parfem u sistemu prerade
 */
@Entity("perfumes")
@Index(["status"])
@Index(["type"])
export class Perfume {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Column({ type: "enum", enum: PerfumeType })
  type!: PerfumeType;

  @Column({ type: "int" })
  netQuantityMl!: number; // 150 ili 250

  @Column({ type: "varchar", length: 50, unique: true })
  serialNumber!: string; // PP-2025-{ID}

  @Column({ type: "uuid" })
  plantId!: string;

  @Column({ type: "date" })
  expirationDate!: Date;

  @Column({ type: "enum", enum: PerfumeStatus, default: PerfumeStatus.CREATED })
  status!: PerfumeStatus;

  @Column({ type: "uuid", nullable: true })
  packagingId?: string;

  @ManyToOne(() => Packaging, packaging => packaging.perfumes, { nullable: true })
  @JoinColumn({ name: "packagingId" })
  packaging?: Packaging;

  @CreateDateColumn()
  createdAt!: Date;

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      netQuantityMl: this.netQuantityMl,
      serialNumber: this.serialNumber,
      plantId: this.plantId,
      expirationDate: this.expirationDate,
      status: this.status,
      packagingId: this.packagingId,
      createdAt: this.createdAt
    };
  }
}