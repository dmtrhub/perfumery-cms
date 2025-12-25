import { CreatePlantDTO } from "../../Domain/DTOs/CreatePlantDTO";
import { UpdatePlantOilIntensityDTO } from "../../Domain/DTOs/UpdatePlantOilIntensityDTO";
import { HarvestPlantsDTO } from "../../Domain/DTOs/HarvestPlantsDTO";

export function validateCreatePlant(data: CreatePlantDTO): { 
  valid: boolean; 
  errors?: string[] 
} {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length < 2) {
    errors.push("Plant name must be at least 2 characters long");
  }

  if (!data.latinName || data.latinName.trim().length < 2) {
    errors.push("Latin name is required");
  }

  if (!data.countryOfOrigin || data.countryOfOrigin.trim().length < 2) {
    errors.push("Country of origin is required");
  }

  if (!data.quantity || data.quantity <= 0) {
    errors.push("Quantity must be greater than 0");
  }

  if (data.quantity > 1000) {
    errors.push("Quantity cannot exceed 1000");
  }

  if (data.oilIntensity && (data.oilIntensity < 1.0 || data.oilIntensity > 5.0)) {
    errors.push("Oil intensity must be between 1.0 and 5.0");
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

export function validateUpdateOilIntensity(data: UpdatePlantOilIntensityDTO): { 
  valid: boolean; 
  errors?: string[] 
} {
  const errors: string[] = [];

  if (!data.plantId || data.plantId <= 0) {
    errors.push("Valid plant ID is required");
  }

  if (data.percentage === undefined || data.percentage === null) {
    errors.push("Percentage is required");
  }

  if (data.percentage < -100 || data.percentage > 100) {
    errors.push("Percentage must be between -100 and 100");
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

export function validateHarvestPlants(data: HarvestPlantsDTO): { 
  valid: boolean; 
  errors?: string[] 
} {
  const errors: string[] = [];

  if (!data.plantId || data.plantId <= 0) {
    errors.push("Valid plant ID is required");
  }

  if (!data.quantity || data.quantity <= 0) {
    errors.push("Quantity must be greater than 0");
  }

  if (data.quantity > 10000) {
    errors.push("Quantity cannot exceed 10,000");
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

export function validateRequestNewPlant(data: { 
  processedPlantId: number; 
  processedIntensity: number 
}): { 
  valid: boolean; 
  errors?: string[] 
} {
  const errors: string[] = [];

  if (!data.processedPlantId || data.processedPlantId <= 0) {
    errors.push("Valid processed plant ID is required");
  }

  if (!data.processedIntensity || data.processedIntensity < 1.0 || data.processedIntensity > 5.0) {
    errors.push("Processed intensity must be between 1.0 and 5.0");
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}