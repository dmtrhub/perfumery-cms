import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { StoragePackaging } from "./StoragePackaging";
import { WarehouseType } from "../enums/WarehouseType";

@Entity("warehouses")
export class Warehouse {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Column({ type: "varchar", length: 255 })
  location!: string;

  @Column({ type: "int", default: 100 })
  maxCapacity!: number;

  @Column({ type: "int", default: 0 })
  currentCapacity!: number;

  @Column({ 
    type: "enum", 
    enum: WarehouseType, 
    default: WarehouseType.DISTRIBUTION 
  })
  type!: WarehouseType;

  @OneToMany(() => StoragePackaging, (packaging) => packaging.warehouse)
  packages!: StoragePackaging[];
}