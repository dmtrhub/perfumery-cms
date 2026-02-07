import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from "typeorm";
import { PlantStatus } from "../enums/PlantStatus";

/**
 * Plant Entity
 * Predstavlja biljku u sistemu proizvodnje
 */
@Entity("plants")
@Index(["status"])
@Index(["commonName"])
export class Plant {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 100 })
  commonName!: string;

  @Column({ type: "varchar", length: 100 })
  latinName!: string;

  @Column({ type: "varchar", length: 100 })
  originCountry!: string;

  @Column({ type: "decimal", precision: 3, scale: 2 })
  aromaticOilStrength!: number; // 1.00 - 5.00

  @Column({ type: "enum", enum: PlantStatus, default: PlantStatus.PLANTED })
  status!: PlantStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  toJSON() {
    return {
      id: this.id,
      commonName: this.commonName,
      latinName: this.latinName,
      originCountry: this.originCountry,
      aromaticOilStrength: this.aromaticOilStrength,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}