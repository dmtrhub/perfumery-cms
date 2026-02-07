import { PlantStatus } from "../enums/PlantStatus";

export class PlantDTO {
  id!: string;
  commonName!: string;
  latinName!: string;
  originCountry!: string;
  aromaticOilStrength!: number;
  status!: PlantStatus;
  createdAt!: Date;
  updatedAt!: Date;
}