import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { SalesPackagingStatus } from '../enums/SalesPackagingStatus';

@Entity('sales_packagings')
export class SalesPackaging {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  originalPackagingId!: string;

  @Column('json')
  perfumeIds!: string[];

  @Column({ type: 'json', nullable: true })
  perfumes?: any[]; // Čuva sve perfume detalje (name, type, netQuantityMl, serialNumber...)

  @Column({ type: 'enum', enum: SalesPackagingStatus, default: SalesPackagingStatus.RECEIVED })
  status!: SalesPackagingStatus;

  @CreateDateColumn()
  receivedAt!: Date;

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
      perfumeIds: perfumeIds,
      perfumes: perfumes,
      status: this.status,
      receivedAt: this.receivedAt
    };
  }
}
