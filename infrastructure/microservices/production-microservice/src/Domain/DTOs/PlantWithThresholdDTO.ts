import { PlantDTO } from "./PlantDTO";

export interface PlantWithThresholdDTO extends PlantDTO {
  exceedsThreshold: boolean;
  thresholdDeviation: number;
  percentageAboveThreshold: number;
}