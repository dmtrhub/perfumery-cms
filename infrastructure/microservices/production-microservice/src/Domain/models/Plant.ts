import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { PlantState } from "../enums/PlantState";

@Entity("plants")
export class Plant {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 100 })
  name!: string; // General name (e.g., "Lavender", "Rose")

  @Column({ 
    type: "decimal", 
    precision: 3, 
    scale: 2,
    name: "oil_intensity" 
  })
  oilIntensity!: number; // 1.0 - 5.0

  @Column({ type: "varchar", length: 150, name: "latin_name" })
  latinName!: string; // Latin name

  @Column({ type: "varchar", length: 100, name: "country_of_origin" })
  countryOfOrigin!: string; // Country of origin

  @Column({
    type: "enum",
    enum: PlantState,
    default: PlantState.PLANTED,
    name: "state"
  })
  state!: PlantState;

  @Column({ type: "int", default: 0, name: "quantity" })
  quantity!: number; // How many pieces available

  @Column({ type: "int", default: 0, name: "remaining_for_processing" })
  remainingForProcessing!: number; // Remaining for processing

  @Column({ type: "boolean", default: false, name: "available_for_harvest" })
  availableForHarvest!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  // Helper methods
  public harvestQuantity(amount: number): boolean {
    if (this.quantity >= amount && this.availableForHarvest) {
      this.quantity -= amount;
      this.remainingForProcessing += amount;
      return true;
    }
    return false;
  }

  public changeOilIntensity(percentage: number): void {
    const newIntensity = this.oilIntensity * (1 + percentage / 100);
    this.oilIntensity = Math.max(1.0, Math.min(5.0, newIntensity));
  }

  public markAsHarvested(): void {
    this.state = PlantState.HARVESTED;
    this.availableForHarvest = true;
  }

  public markAsProcessed(): void {
    this.state = PlantState.PROCESSED;
    this.remainingForProcessing = 0;
  }

  public adjustOilIntensityBasedOnProcessed(processedIntensity: number): void {
    // From spec: if processed plant had intensity 4.65, reduce to 65% of current value
    const threshold = 4.00;
    if (processedIntensity > threshold) {
      const percentageAbove = ((processedIntensity - threshold) / threshold) * 100;
      const reductionPercentage = percentageAbove;
      this.changeOilIntensity(-reductionPercentage);
    }
  }
}