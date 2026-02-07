import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("performance_reports")
export class PerformanceReport {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  algorithmName!: string;

  @Column({ type: "json" })
  simulationData!: Record<string, unknown>;

  @Column({ type: "decimal", precision: 5, scale: 2 })
  efficiency!: number;

  @Column({ type: "text" })
  conclusions!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
