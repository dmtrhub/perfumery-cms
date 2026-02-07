import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn
} from "typeorm";
import { PackagingStatus } from "../enums/PackagingStatus";
import { Warehouse } from "./Warehouse";

/**
 * StoragePackaging Entity
 * Predstavlja ambalažu u skladištu
 */
@Entity("storage_packagings")
@Index(["status"])
export class StoragePackaging {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  originalPackagingId!: string;

  @Column({ type: "uuid" })
  warehouseId!: string;

  @Column({ type: "json" })
  perfumeIds!: string[]; // JSON array

  @Column({ type: "json", nullable: true })
  perfumes?: any[]; // Čuva sve perfume detalje (name, type, netQuantityMl, serialNumber...)

  @Column({ type: "enum", enum: PackagingStatus, default: PackagingStatus.STORED })
  status!: PackagingStatus;

  @Column({ type: "datetime", nullable: true })
  sentToSalesAt?: Date;

  @ManyToOne(() => Warehouse, warehouse => warehouse.packagings)
  @JoinColumn({ name: "warehouseId" })
  warehouse!: Warehouse;

  @CreateDateColumn()
  createdAt!: Date;

  toJSON() {
    let perfumeIds: string[] = [];
    
    if (this.perfumeIds) {
      if (typeof this.perfumeIds === 'string') {
        try {
          perfumeIds = JSON.parse(this.perfumeIds);
        } catch {
          perfumeIds = [];
        }
      } else if (Array.isArray(this.perfumeIds)) {
        perfumeIds = this.perfumeIds;
      }
    }

    let perfumes: any[] = [];
    if (this.perfumes) {
      if (typeof this.perfumes === 'string') {
        try {
          perfumes = JSON.parse(this.perfumes);
        } catch {
          perfumes = [];
        }
      } else if (Array.isArray(this.perfumes)) {
        perfumes = this.perfumes;
      }
    }

    return {
      id: this.id,
      originalPackagingId: this.originalPackagingId,
      warehouseId: this.warehouseId,
      perfumeIds: perfumeIds,
      perfumes: perfumes,
      status: this.status,
      sentToSalesAt: this.sentToSalesAt,
      createdAt: this.createdAt
    };
  }
}