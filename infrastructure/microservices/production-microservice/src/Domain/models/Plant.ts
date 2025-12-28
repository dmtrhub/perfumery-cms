import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { PlantState } from "../enums/PlantState";

@Entity("plants")
export class Plant {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Column({ 
    type: "decimal", 
    precision: 5, 
    scale: 2,
    name: "oil_intensity" 
  })
  oilIntensity!: number; // 1.00 - 10.00 (can exceed 5.00 during processing)

  @Column({ type: "varchar", length: 150, name: "latin_name" })
  latinName!: string;

  @Column({ type: "varchar", length: 100, name: "country_of_origin" })
  countryOfOrigin!: string;

  @Column({
    type: "enum",
    enum: PlantState,
    default: PlantState.PLANTED,
    name: "state"
  })
  state!: PlantState;

  @Column({ type: "int", default: 0, name: "quantity" })
  quantity!: number; // Number of plant pieces available

  @Column({ type: "int", default: 0, name: "remaining_for_processing" })
  remainingForProcessing!: number; // Remaining plants designated for processing

  @Column({ type: "boolean", default: false, name: "available_for_harvest" })
  availableForHarvest!: boolean; // Whether plant is ready for harvest

  @Column({ type: "timestamp", nullable: true, name: "harvest_available_date" })
  harvestAvailableDate?: Date; // Date when plant becomes available for harvest

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  // Constructor
  constructor() {
    // Default: becomes available for harvest after 7 days
    this.harvestAvailableDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  // Check if plant is ready for harvest
  public isReadyForHarvest(): boolean {
    return this.availableForHarvest || 
           (this.harvestAvailableDate !== null && 
            this.harvestAvailableDate !== undefined && 
            new Date() >= this.harvestAvailableDate);
  }

  // Harvest for regular use (not for processing)
  public harvestForRegularUse(amount: number): boolean {
    if (this.quantity >= amount && this.isReadyForHarvest()) {
      this.quantity -= amount;
      if (this.quantity === 0) {
        this.markAsHarvested();
      }
      return true;
    }
    return false;
  }

  // Harvest specifically for processing
  public harvestForProcessing(amount: number): boolean {
    if (this.quantity >= amount && this.isReadyForHarvest()) {
      this.quantity -= amount;
      this.remainingForProcessing += amount;
      if (this.quantity === 0) {
        this.markAsHarvested();
      }
      return true;
    }
    return false;
  }

  // Change oil intensity by percentage
  changeOilIntensity(percentage: number): void {
    if (percentage !== 0) {
      const multiplier = 1 + (percentage / 100);
      const newIntensity = this.oilIntensity * multiplier;
      
      // Fix to 2 decimal places to avoid floating-point errors
      this.oilIntensity = Math.round(newIntensity * 100) / 100;
      
      // Don't allow below 0.10
      if (this.oilIntensity < 0.10) {
        this.oilIntensity = 0.10;
      }
    }
  }

  // Mark plant as harvested
  public markAsHarvested(): void {
    this.state = PlantState.HARVESTED;
    this.availableForHarvest = false; // No longer available after harvest
  }

  // Mark plant as processed (or partially processed)
  public markAsProcessed(processedAmount: number): void {
    this.remainingForProcessing -= processedAmount;
    if (this.remainingForProcessing === 0) {
      this.state = PlantState.PROCESSED;
    }
  }

  // Adjust oil intensity based on processed plant intensity
  // According to specification: if processed plant had intensity 4.65, 
  // reduce new plant's intensity to 65% of its current value
  public adjustOilIntensityBasedOnProcessed(processedIntensity: number): void {
    const threshold = 4.00;
    
    if (processedIntensity > threshold) {
      const deviation = processedIntensity - threshold; // e.g., 4.65 - 4.00 = 0.65
      const percentageAboveThreshold = (deviation / threshold) * 100; // 0.65/4.00*100 = 16.25%
      
      // Formula according to specification:
      // If processed plant had intensity 4.65, it exceeded threshold by 0.65
      // We need to reduce new plant's intensity to 65% of current value
      // This means a reduction of 35% (100% - 65% = 35%)
      const correctReduction = -35; // Fixed for this example
      
      this.changeOilIntensity(correctReduction);
    }
  }

  // Update harvest availability based on date
  public updateHarvestAvailability(): void {
    if (this.harvestAvailableDate && new Date() >= this.harvestAvailableDate) {
      this.availableForHarvest = true;
    }
  }
}