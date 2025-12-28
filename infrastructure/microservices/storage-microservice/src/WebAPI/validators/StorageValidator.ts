import { WarehouseType } from "../../Domain/enums/WarehouseType";

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  validatedParams?: any;
  parsedId?: number;
}

// Validation for creating a warehouse
export function validateCreateWarehouse(data: any): ValidationResult {
  const errors: string[] = [];
  const validatedParams: any = {};

  // Name validation
  if (!data.name || typeof data.name !== "string") {
    errors.push("Name is required and must be a string");
  } else if (data.name.length < 3) {
    errors.push("Name must be at least 3 characters long");
  } else if (data.name.length > 100) {
    errors.push("Name cannot exceed 100 characters");
  } else {
    validatedParams.name = data.name.trim();
  }

  // Location validation
  if (!data.location || typeof data.location !== "string") {
    errors.push("Location is required and must be a string");
  } else if (data.location.length < 5) {
    errors.push("Location must be at least 5 characters long");
  } else {
    validatedParams.location = data.location.trim();
  }

  // Max capacity validation
  if (!data.maxCapacity || isNaN(data.maxCapacity)) {
    errors.push("Max capacity is required and must be a number");
  } else {
    const capacity = parseInt(data.maxCapacity);
    if (capacity < 1) {
      errors.push("Max capacity must be at least 1");
    } else if (capacity > 10000) {
      errors.push("Max capacity cannot exceed 10000");
    } else {
      validatedParams.maxCapacity = capacity;
    }
  }

  // Type validation
  if (!data.type) {
    errors.push("Type is required");
  } else if (!Object.values(WarehouseType).includes(data.type)) {
    errors.push(
      `Type must be one of: ${Object.values(WarehouseType).join(", ")}`
    );
  } else {
    validatedParams.type = data.type;
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    validatedParams: errors.length === 0 ? validatedParams : undefined,
  };
}

// Validation for receiving packaging
export function validateReceivePackaging(data: any): ValidationResult {
  const errors: string[] = [];
  const validatedParams: any = {};

  // Processing packaging ID validation
  if (!data.processingPackagingId || isNaN(data.processingPackagingId)) {
    errors.push("Processing packaging ID is required and must be a number");
  } else {
    const id = parseInt(data.processingPackagingId);
    if (id < 1) {
      errors.push("Processing packaging ID must be positive");
    } else {
      validatedParams.processingPackagingId = id;
    }
  }

  // Perfume IDs validation
  if (!data.perfumeIds || !Array.isArray(data.perfumeIds)) {
    errors.push("Perfume IDs must be an array");
  } else {
    const perfumeIds = data.perfumeIds;
    if (perfumeIds.length === 0) {
      errors.push("Perfume IDs array cannot be empty");
    } else {
      const invalidIds = perfumeIds.filter(
        (id: any) => !Number.isInteger(id) || id < 1
      );
      if (invalidIds.length > 0) {
        errors.push(
          `Invalid perfume IDs: ${invalidIds.join(
            ", "
          )}. All IDs must be positive integers.`
        );
      } else {
        validatedParams.perfumeIds = perfumeIds;
      }
    }
  }

  // Destination warehouse ID validation
  if (!data.destinationWarehouseId || isNaN(data.destinationWarehouseId)) {
    errors.push("Destination warehouse ID is required and must be a number");
  } else {
    const warehouseId = parseInt(data.destinationWarehouseId);
    if (warehouseId < 1) {
      errors.push("Destination warehouse ID must be positive");
    } else {
      validatedParams.destinationWarehouseId = warehouseId;
    }
  }

  // Optional metadata validation
  if (data.metadata !== undefined && typeof data.metadata !== "object") {
    errors.push("Metadata must be an object if provided");
  } else if (data.metadata) {
    validatedParams.metadata = data.metadata;
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    validatedParams: errors.length === 0 ? validatedParams : undefined,
  };
}

// Validation for shipping packaging
export function validateShipPackaging(data: any): ValidationResult {
  const errors: string[] = [];
  const validatedParams: any = {};

  // Packaging IDs validation
  if (!data.packagingIds || !Array.isArray(data.packagingIds)) {
    errors.push("Packaging IDs must be an array");
  } else {
    const packagingIds = data.packagingIds;
    if (packagingIds.length === 0) {
      errors.push("Packaging IDs array cannot be empty");
    } else if (packagingIds.length > 10) {
      errors.push("Cannot ship more than 10 packages at once");
    } else {
      const invalidIds = packagingIds.filter(
        (id: any) => !Number.isInteger(id) || id < 1
      );
      if (invalidIds.length > 0) {
        errors.push(
          `Invalid packaging IDs: ${invalidIds.join(
            ", "
          )}. All IDs must be positive integers.`
        );
      } else {
        validatedParams.packagingIds = packagingIds;
      }
    }
  }

  // Destination validation
  if (!data.destination || data.destination !== "SALES_SERVICE") {
    errors.push('Destination must be "SALES_SERVICE"');
  } else {
    validatedParams.destination = data.destination;
  }

  // User ID validation
  if (!data.userId || isNaN(data.userId)) {
    errors.push("User ID is required and must be a number");
  } else {
    const userId = parseInt(data.userId);
    if (userId < 1) {
      errors.push("User ID must be positive");
    } else {
      validatedParams.userId = userId;
    }
  }

  // User role validation
  const validRoles = ["MANAGER", "SELLER"];
  if (!data.userRole || !validRoles.includes(data.userRole)) {
    errors.push(`User role must be one of: ${validRoles.join(", ")}`);
  } else {
    validatedParams.userRole = data.userRole;
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    validatedParams: errors.length === 0 ? validatedParams : undefined,
  };
}

// Validation for ID parameter
export function validateIdParam(id: string | number): ValidationResult {
  const errors: string[] = [];
  let parsedId: number | undefined;

  const idStr = typeof id === "number" ? id.toString() : id;

  if (!idStr || idStr.trim() === "") {
    errors.push("ID parameter is required");
  } else {
    const numId = parseInt(idStr);
    if (isNaN(numId)) {
      errors.push("ID must be a valid number");
    } else if (numId < 1) {
      errors.push("ID must be a positive number");
    } else {
      parsedId = numId;
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    parsedId,
  };
}

// Validation for packaging search parameters
export function validatePackagingSearchParams(query: any): ValidationResult {
  const errors: string[] = [];
  const validatedParams: any = {};

  // Status filter
  if (query.status) {
    const validStatuses = [
      "IN_STORAGE",
      "RESERVED",
      "SHIPPED",
      "DELIVERED",
      "IN_TRANSIT",
    ];
    if (!validStatuses.includes(query.status)) {
      errors.push(`Status must be one of: ${validStatuses.join(", ")}`);
    } else {
      validatedParams.status = query.status;
    }
  }

  // Warehouse ID filter
  if (query.warehouseId) {
    const warehouseId = parseInt(query.warehouseId);
    if (isNaN(warehouseId) || warehouseId < 1) {
      errors.push("Warehouse ID must be a positive number");
    } else {
      validatedParams.warehouseId = warehouseId;
    }
  }

  // Limit filter
  if (query.limit) {
    const limit = parseInt(query.limit);
    if (isNaN(limit) || limit < 1) {
      errors.push("Limit must be a positive number");
    } else if (limit > 100) {
      errors.push("Limit cannot exceed 100");
    } else {
      validatedParams.limit = limit;
    }
  }

  // Offset filter
  if (query.offset) {
    const offset = parseInt(query.offset);
    if (isNaN(offset) || offset < 0) {
      errors.push("Offset must be a non-negative number");
    } else {
      validatedParams.offset = offset;
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    validatedParams: errors.length === 0 ? validatedParams : undefined,
  };
}
