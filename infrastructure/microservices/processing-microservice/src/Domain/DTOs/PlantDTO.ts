export interface PlantDTO {
  id: string;
  commonName: string;
  latinName: string;
  originCountry: string;
  aromaticOilStrength: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}