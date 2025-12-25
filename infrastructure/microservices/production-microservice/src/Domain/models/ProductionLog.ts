import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from "typeorm";
import { Plant } from "./Plant";
import { ProductionEventType } from "../enums/ProductionEventType";

@Entity("production_logs")
export class ProductionLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: "enum",
    enum: ProductionEventType,
    name: "event_type"
  })
  eventType!: ProductionEventType;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "json", nullable: true })
  details?: Record<string, any>;

  @ManyToOne(() => Plant, { nullable: true })
  plant?: Plant;

  @Column({ nullable: true })
  quantity?: number;

  @Column({ 
    type: "decimal", 
    precision: 3, 
    scale: 2, 
    nullable: true,
    name: "oil_intensity" 
  })
  oilIntensity?: number;

  @CreateDateColumn({ name: "date_time" })
  dateTime!: Date;

  @Column({ nullable: true, name: "user_id" })
  userId?: number;

  @Column({ type: "boolean", default: false, name: "successful" })
  successful!: boolean;

  @Column({ type: "varchar", length: 50, nullable: true, name: "source" })
  source?: string; // "CLIENT" or "PROCESSING_SERVICE"
}