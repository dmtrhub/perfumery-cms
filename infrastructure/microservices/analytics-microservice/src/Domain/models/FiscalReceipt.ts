import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { SaleType } from '../enums/SaleType';
import { PaymentMethod } from '../enums/PaymentMethod';

@Entity('fiscal_receipts')
export class FiscalReceipt {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: SaleType })
  saleType!: SaleType;

  @Column({ type: 'enum', enum: PaymentMethod })
  paymentMethod!: PaymentMethod;

  @Column({ type: 'json' })
  items!: Array<{ perfumeId: string; quantity: number; price: number }>;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount!: number;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 255 })
  username!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
