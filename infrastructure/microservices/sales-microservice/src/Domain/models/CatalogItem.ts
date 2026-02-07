import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { PerfumeType } from '../enums/PerfumeType';

@Entity('catalog_items')
export class CatalogItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  perfumeId!: string;

  @Column()
  name!: string;

  @Column({ type: 'enum', enum: PerfumeType })
  type!: PerfumeType;

  @Column()
  netQuantityMl!: number;

  @Column({ default: 0 })
  quantity!: number;

  @Column({ default: true })
  available!: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
