// 1. Default sensitive fields to mask across all the projects
const DEFAULT_MASK_FIELDS = [
  'password',
  'token',
  'secret',
  'authorization',
  'creditcard',
  'cardnumber',
  'ssn',
  'apikey',
  'passwordconfirmation'
];

// 2. Allow consuming projects to append custom fields via an environment variable (comma-separated)
const customMaskFields = process.env.LOGGER_CUSTOM_MASK_FIELDS
  ? process.env.LOGGER_CUSTOM_MASK_FIELDS.split(',').map(field => field.trim().toLowerCase())
  : [];

// Merge defaults with project-specific custom fields
const maskFields = [...new Set([...DEFAULT_MASK_FIELDS, ...customMaskFields])];

module.exports = {
  // Determine if the app is running in development mode
    isDevelopment: process.env.NODE_ENV !== 'production',

  // Current log level (default to 'info' if not specified)
    logLevel: process.env.LOG_LEVEL || 'info',

  // The final array of lowercase fields to be obfuscated
    maskFields,

  // HTTP tracking defaults
    requestIdHeader: process.env.LOGGER_REQUEST_ID_HEADER || 'x-request-id'
};