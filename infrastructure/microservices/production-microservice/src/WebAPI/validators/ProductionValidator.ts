export function validatePlantSearchParams(params: any): {
  valid: boolean;
  errors?: string[];
  validatedParams: {
    name?: string;
    state?: string;
    minIntensity?: number;
    maxIntensity?: number;
    availableOnly?: boolean;
  };
} {
  const errors: string[] = [];
  const validatedParams: any = {};

  if (params.name && typeof params.name === "string") {
    if (params.name.length < 2) {
      errors.push("Search name must be at least 2 characters");
    } else {
      validatedParams.name = params.name.trim();
    }
  }

  if (params.state && typeof params.state === "string") {
    const validStates = ["PLANTED", "HARVESTED", "PROCESSED"];
    if (!validStates.includes(params.state.toUpperCase())) {
      errors.push(`Invalid state. Must be one of: ${validStates.join(", ")}`);
    } else {
      validatedParams.state = params.state.toUpperCase();
    }
  }

  if (params.minIntensity) {
    const min = parseFloat(params.minIntensity);
    if (isNaN(min) || min < 1.0 || min > 5.0) {
      errors.push("Minimum intensity must be between 1.0 and 5.0");
    } else {
      validatedParams.minIntensity = min;
    }
  }

  if (params.maxIntensity) {
    const max = parseFloat(params.maxIntensity);
    if (isNaN(max) || max < 1.0 || max > 5.0) {
      errors.push("Maximum intensity must be between 1.0 and 5.0");
    } else {
      validatedParams.maxIntensity = max;
    }
  }

  // Validate range
  if (validatedParams.minIntensity && validatedParams.maxIntensity) {
    if (validatedParams.minIntensity > validatedParams.maxIntensity) {
      errors.push("Minimum intensity cannot be greater than maximum intensity");
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

export function validateLogsQueryParams(params: any): {
  valid: boolean;
  errors?: string[];
  validatedParams: {
    plantId?: number;
    eventType?: string;
    startDate?: Date;
    endDate?: Date;
    successfulOnly?: boolean;
    limit?: number;
  };
} {
  const errors: string[] = [];
  const validatedParams: any = {};

  if (params.plantId) {
    const plantId = parseInt(params.plantId);
    if (isNaN(plantId) || plantId <= 0) {
      errors.push("Plant ID must be a positive number");
    } else {
      validatedParams.plantId = plantId;
    }
  }

  if (params.eventType && typeof params.eventType === "string") {
    const validEventTypes = [
      "PLANTING",
      "OIL_INTENSITY_CHANGE",
      "HARVEST",
      "OIL_INTENSITY_GENERATION",
      "ERROR",
      "INFO",
    ];
    if (!validEventTypes.includes(params.eventType.toUpperCase())) {
      errors.push(
        `Invalid event type. Must be one of: ${validEventTypes.join(", ")}`
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
