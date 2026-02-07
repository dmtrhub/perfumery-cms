import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  OneToMany
} from "typeorm";
import { WarehouseType } from "../enums/WarehouseType";
import { StoragePackaging } from "./StoragePackaging";

/**
 * Warehouse Entity
 * Predstavlja skladište u sistemu
 */
@Entity("warehouses")
@Index(["type"])
export class Warehouse {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Column({ type: "varchar", length: 255 })
  location!: string;

  @Column({ type: "int" })
  maxCapacity!: number; // Maksimalan broj ambalaža

  @Column({ type: "enum", enum: WarehouseType })
  type!: WarehouseType;

  @OneToMany(() => StoragePackaging, packaging => packaging.warehouse)
  packagings!: StoragePackaging[];

  @CreateDateColumn()
  createdAt!: Date;

  toJSON() {
    // Računa samo STORED pakovanja, ne i SENT_TO_SALES
    const storedCount = this.packagings?.filter(p => p.status === "STORED").length || 0;
    
    return {
      id: this.id,
      name: this.name,
      location: this.location,
      maxCapacity: this.maxCapacity,
      type: this.type,
      createdAt: this.createdAt,
      currentCapacity: storedCount
    };
  }
}