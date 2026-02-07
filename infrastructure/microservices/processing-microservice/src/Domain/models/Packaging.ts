import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  OneToMany
} from "typeorm";
import { PackagingStatus } from "../enums/PackagingStatus";
import { Perfume } from "./Perfume";

/**
 * Packaging Entity
 * Predstavlja ambalažu za slanje parfema
 */
@Entity("packagings")
@Index(["status"])
export class Packaging {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Column({ type: "varchar", length: 255 })
  senderAddress!: string;

  @Column({ type: "uuid" })
  warehouseId!: string;

  @Column({ type: "enum", enum: PackagingStatus, default: PackagingStatus.PACKED })
  status!: PackagingStatus;

  @Column({ type: "datetime", nullable: true })
  sentAt?: Date;

  @OneToMany(() => Perfume, perfume => perfume.packaging)
  perfumes!: Perfume[];

  @CreateDateColumn()
  createdAt!: Date;

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      senderAddress: this.senderAddress,
      warehouseId: this.warehouseId,
      status: this.status,
      sentAt: this.sentAt,
      perfumeIds: this.perfumes?.map(p => p.id) || [],
      perfumes: this.perfumes?.map(p => p.toJSON()) || [],
      createdAt: this.createdAt
    };
  }
}