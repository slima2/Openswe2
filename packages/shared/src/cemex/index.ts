/**
 * CEMEX Configuration Console - Shared Package
 * Main export file for all CEMEX shared utilities, types, constants, and business logic
 */

// Export all types
export * from "./types.js";

// Export all constants  
export * from "./constants.js";

// Export all validation functions and schemas
export * from "./validation.js";

// Export all utility functions
export * from "./utils.js";

// Simple default export to avoid complex object literal issues
export default {
  name: "CEMEX Shared Package",
  version: "1.0.0",
};



