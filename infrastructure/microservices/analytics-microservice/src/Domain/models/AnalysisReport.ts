import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('analysis_reports')
export class AnalysisReport {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  reportType!: string;

  @Column({ type: 'json' })
  data!: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;
}
