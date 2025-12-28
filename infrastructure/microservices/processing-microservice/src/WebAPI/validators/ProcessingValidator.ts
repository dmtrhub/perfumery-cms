import { CreatePerfumeDTO } from "../../Domain/DTOs/CreatePerfumeDTO";
import { ProcessPlantsDTO } from "../../Domain/DTOs/ProcessPlantsDTO";
import { PackagingRequestDTO } from "../../Domain/DTOs/PackagingRequestDTO";
import { ShipPackagingDTO } from "../../Domain/DTOs/ShipPackagingDTO";
import { PerfumeType } from "../../Domain/enums/PerfumeType";
import { BottleSize } from "../../Domain/enums/BottleSize";
import { SourceType } from "../../Domain/enums/SourceType";
import { ProcessingStatus } from "../../Domain/enums/ProcessingStatus";
import { PackagingStatus } from "../../Domain/enums/PackagingStatus";

export function validateCreatePerfume(data: CreatePerfumeDTO): {
  valid: boolean;
  errors?: string[];
} {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length < 2) {
    errors.push("Perfume name must be at least 2 characters long");
  }

  if (!data.type || !Object.values(PerfumeType).includes(data.type)) {
    errors.push(
      `Valid perfume type is required. Options: ${Object.values(PerfumeType).join(
        ", "
      )}`
    );
  }

  if (!data.bottleSize || !Object.values(BottleSize).includes(data.bottleSize)) {
    errors.push(
      `Valid bottle size is required. Options: ${Object.values(BottleSize).join(
        ", "
      )}`
    );
  }

  if (data.initialQuantity !== undefined) {
    if (data.initialQuantity < 0) {
      errors.push("Initial quantity cannot be negative");
    }
    if (data.initialQuantity > 10000) {
      errors.push("Initial quantity cannot exceed 10000");
    }
  }

  if (data.userId !== undefined && (data.userId <= 0 || !Number.isInteger(data.userId))) {
    errors.push("User ID must be a positive integer");
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

export function validateProcessPlants(data: ProcessPlantsDTO): {
  valid: boolean;
  errors?: string[];
} {
  const errors: string[] = [];

  if (!data.perfumeType || !Object.values(PerfumeType).includes(data.perfumeType)) {
    errors.push(
      `Valid perfume type is required. Options: ${Object.values(PerfumeType).join(
        ", "
      )}`
    );
  }

  if (!data.bottleSize || !Object.values(BottleSize).includes(data.bottleSize)) {
    errors.push(
      `Valid bottle size is required. Options: ${Object.values(BottleSize).join(
        ", "
      )}`
    );
  }

  if (!data.bottleCount || data.bottleCount <= 0) {
    errors.push("Bottle count must be greater than 0");
  }

  if (data.bottleCount > 1000) {
    errors.push("Cannot process more than 1000 bottles at once");
  }

  if (data.userId !== undefined && (data.userId <= 0 || !Number.isInteger(data.userId))) {
    errors.push("User ID must be a positive integer");
  }

  if (data.source && !Object.values(SourceType).includes(data.source)) {
    errors.push(
      `Valid source type is required. Options: ${Object.values(SourceType).join(
        ", "
      )}`
    );
  }

  if (data.externalRequestId && data.externalRequestId.length > 255) {
    errors.push("External request ID is too long (max 255 characters)");
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

export function validatePackagingRequest(data: PackagingRequestDTO): {
  valid: boolean;
  errors?: string[];
} {
  const errors: string[] = [];

  if (!data.perfumeType || !Object.values(PerfumeType).includes(data.perfumeType)) {
    errors.push(
      `Valid perfume type is required. Options: ${Object.values(PerfumeType).join(
        ", "
      )}`
    );
  }

  if (!data.quantity || data.quantity <= 0) {
    errors.push("Quantity must be greater than 0");
  }

  if (data.quantity > 10000) {
    errors.push("Cannot package more than 10000 bottles at once");
  }

  if (data.bottleSize && !Object.values(BottleSize).includes(data.bottleSize)) {
    errors.push(
      `Valid bottle size is required. Options: ${Object.values(BottleSize).join(
        ", "
      )}`
    );
  }

  if (data.destinationWarehouse && data.destinationWarehouse.length > 100) {
    errors.push("Warehouse location is too long (max 100 characters)");
  }

  if (data.userId !== undefined && (data.userId <= 0 || !Number.isInteger(data.userId))) {
    errors.push("User ID must be a positive integer");
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

export function validateShipPackaging(data: ShipPackagingDTO): {
  valid: boolean;
  errors?: string[];
} {
  const errors: string[] = [];

  if (!data.warehouseLocation || data.warehouseLocation.trim().length < 2) {
    errors.push("Warehouse location is required (min 2 characters)");
  }

  if (data.warehouseLocation && data.warehouseLocation.length > 100) {
    errors.push("Warehouse location is too long (max 100 characters)");
  }

  if (data.trackingNumber && data.trackingNumber.length > 255) {
    errors.push("Tracking number is too long (max 255 characters)");
  }

  if (data.userId !== undefined && (data.userId <= 0 || !Number.isInteger(data.userId))) {
    errors.push("User ID must be a positive integer");
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

export function validatePerfumeSearchParams(params: any): {
  valid: boolean;
  errors?: string[];
  validatedParams: {
    type?: PerfumeType;
    minQuantity?: number;
    bottleSize?: BottleSize;
    availableOnly?: boolean;
  };
} {
  const errors: string[] = [];
  const validatedParams: any = {};

  if (params.type && typeof params.type === "string") {
    if (!Object.values(PerfumeType).includes(params.type as PerfumeType)) {
      errors.push(
        `Invalid perfume type. Options: ${Object.values(PerfumeType).join(
          ", "
        )}`
      );
    } else {
      validatedParams.type = params.type;
    }
  }

  if (params.minQuantity) {
    const min = parseFloat(params.minQuantity);
    if (isNaN(min) || min < 0) {
      errors.push("Minimum quantity must be a positive number");
    } else {
      validatedParams.minQuantity = min;
    }
  }

  if (params.bottleSize) {
    const size = parseInt(params.bottleSize);
    if (!Object.values(BottleSize).includes(size)) {
      errors.push(
        `Invalid bottle size. Options: ${Object.values(BottleSize).join(", ")}`
      );
    } else {
      validatedParams.bottleSize = size;
    }
  }

  if (params.availableOnly) {
    validatedParams.availableOnly =
      params.availableOnly === "true" || params.availableOnly === true;
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    validatedParams,
  };
}

export function validateBatchSearchParams(params: any): {
  valid: boolean;
  errors?: string[];
  validatedParams: {
    status?: ProcessingStatus;
    perfumeType?: PerfumeType;
    source?: SourceType;
    startDate?: Date;
    endDate?: Date;
  };
} {
  const errors: string[] = [];
  const validatedParams: any = {};

  if (params.status && typeof params.status === "string") {
    if (!Object.values(ProcessingStatus).includes(params.status as ProcessingStatus)) {
      errors.push(
        `Invalid status. Options: ${Object.values(ProcessingStatus).join(", ")}`
      );
    } else {
      validatedParams.status = params.status;
    }
  }

  if (params.perfumeType && typeof params.perfumeType === "string") {
    if (!Object.values(PerfumeType).includes(params.perfumeType as PerfumeType)) {
      errors.push(
        `Invalid perfume type. Options: ${Object.values(PerfumeType).join(
          ", "
        )}`
      );
    } else {
      validatedParams.perfumeType = params.perfumeType;
    }
  }

  if (params.source && typeof params.source === "string") {
    if (!Object.values(SourceType).includes(params.source as SourceType)) {
      errors.push(
        `Invalid source. Options: ${Object.values(SourceType).join(", ")}`
      );
    } else {
      validatedParams.source = params.source;
    }
  }

  if (params.startDate) {
    const startDate = new Date(params.startDate);
    if (isNaN(startDate.getTime())) {
      errors.push("Invalid start date format");
    } else {
      validatedParams.startDate = startDate;
    }
  }

  if (params.endDate) {
    const endDate = new Date(params.endDate);
    if (isNaN(endDate.getTime())) {
      errors.push("Invalid end date format");
    } else {
      validatedParams.endDate = endDate;
    }
  }

  // Validate date range
  if (validatedParams.startDate && validatedParams.endDate) {
    if (validatedParams.startDate > validatedParams.endDate) {
      errors.push("Start date cannot be after end date");
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    validatedParams,
  };
}

export function validatePackagingSearchParams(params: any): {
  valid: boolean;
  errors?: string[];
  validatedParams: {
    status?: PackagingStatus;
    perfumeType?: PerfumeType;
    warehouseLocation?: string;
    shippedOnly?: boolean;
  };
} {
  const errors: string[] = [];
  const validatedParams: any = {};

  if (params.status && typeof params.status === "string") {
    if (!Object.values(PackagingStatus).includes(params.status as PackagingStatus)) {
      errors.push(
        `Invalid packaging status. Options: ${Object.values(PackagingStatus).join(
          ", "
        )}`
      );
    } else {
      validatedParams.status = params.status;
    }
  }

  if (params.perfumeType && typeof params.perfumeType === "string") {
    if (!Object.values(PerfumeType).includes(params.perfumeType as PerfumeType)) {
      errors.push(
        `Invalid perfume type. Options: ${Object.values(PerfumeType).join(
          ", "
        )}`
      );
    } else {
      validatedParams.perfumeType = params.perfumeType;
    }
  }

  if (params.warehouseLocation && typeof params.warehouseLocation === "string") {
    if (params.warehouseLocation.length > 100) {
      errors.push("Warehouse location is too long (max 100 characters)");
    } else {
      validatedParams.warehouseLocation = params.warehouseLocation.trim();
    }
  }

  if (params.shippedOnly) {
    validatedParams.shippedOnly =
      params.shippedOnly === "true" || params.shippedOnly === true;
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    validatedParams,
  };
}

export function validateProcessingLogsParams(params: any): {
  valid: boolean;
  errors?: string[];
  validatedParams: {
    batchId?: number;
    perfumeType?: PerfumeType;
    eventType?: string;
    startDate?: Date;
    endDate?: Date;
    successfulOnly?: boolean;
    limit?: number;
  };
} {
  const errors: string[] = [];
  const validatedParams: any = {};

  if (params.batchId) {
    const batchId = parseInt(params.batchId);
    if (isNaN(batchId) || batchId <= 0) {
      errors.push("Batch ID must be a positive number");
    } else {
      validatedParams.batchId = batchId;
    }
  }

  if (params.perfumeType && typeof params.perfumeType === "string") {
    if (!Object.values(PerfumeType).includes(params.perfumeType as PerfumeType)) {
      errors.push(
        `Invalid perfume type. Options: ${Object.values(PerfumeType).join(
          ", "
        )}`
      );
    } else {
      validatedParams.perfumeType = params.perfumeType;
    }
  }

  if (params.eventType && typeof params.eventType === "string") {
    const validEventTypes = [
      "PROCESSING_STARTED",
      "PROCESSING_COMPLETED",
      "PROCESSING_FAILED",
      "PACKAGING_REQUESTED",
      "PACKAGING_SHIPPED",
      "PERFUME_CREATED",
      "INVENTORY_UPDATED",
    ];
    if (!validEventTypes.includes(params.eventType.toUpperCase())) {
      errors.push(
        `Invalid event type. Options: ${validEventTypes.join(", ")}`
      );
    } else {
      validatedParams.eventType = params.eventType.toUpperCase();
    }
  }

  if (params.startDate) {
    const startDate = new Date(params.startDate);
    if (isNaN(startDate.getTime())) {
      errors.push("Invalid start date format");
    } else {
      validatedParams.startDate = startDate;
    }
  }

  if (params.endDate) {
    const endDate = new Date(params.endDate);
    if (isNaN(endDate.getTime())) {
      errors.push("Invalid end date format");
    } else {
      validatedParams.endDate = endDate;
    }
  }

  // Validate date range
  if (validatedParams.startDate && validatedParams.endDate) {
    if (validatedParams.startDate > validatedParams.endDate) {
      errors.push("Start date cannot be after end date");
    }
  }

  if (params.successfulOnly) {
    validatedParams.successfulOnly =
      params.successfulOnly === "true" || params.successfulOnly === true;
  }

  if (params.limit) {
    const limit = parseInt(params.limit);
    if (isNaN(limit) || limit <= 0 || limit > 1000) {
      errors.push("Limit must be between 1 and 1000");
    } else {
      validatedParams.limit = limit;
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    validatedParams,
  };
}

export function validateIdParam(id: string): {
  valid: boolean;
  errors?: string[];
  parsedId?: number;
} {
  const errors: string[] = [];
  const parsedId = parseInt(id);

  if (isNaN(parsedId) || parsedId <= 0) {
    errors.push("Valid ID is required (positive number)");
  }

  if (parsedId > 999999) {
    errors.push("ID is too large");
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    parsedId: errors.length === 0 ? parsedId : undefined,
  };
}

export function validateRequestWithId(
  id: string,
  data: any,
  validatorFn: (data: any) => { valid: boolean; errors?: string[] }
): {
  valid: boolean;
  errors?: string[];
  parsedId?: number;
  bodyErrors?: string[];
} {
  const idValidation = validateIdParam(id);
  const bodyValidation = validatorFn(data);

  const allErrors = [
    ...(idValidation.errors || []),
    ...(bodyValidation.errors || []),
  ];

  return {
    valid: idValidation.valid && bodyValidation.valid,
    errors: allErrors.length > 0 ? allErrors : undefined,
    parsedId: idValidation.parsedId,
    bodyErrors: bodyValidation.errors,
  };
}