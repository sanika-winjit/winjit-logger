const winston = require('winston');
const config = require('../config');

/**
 * Recursive function to traverse an object and mask sensitive keys.
 * Handles deeply nested objects and arrays.
 */
const maskObject = (obj) => {
  // Return early if the value is null, undefined, or not an object/array
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  // Handle arrays explicitly to preserve structure
  if (Array.isArray(obj)) {
    return obj.map(item => maskObject(item));
  }

  // Create a shallow clone to avoid modifying the original application runtime objects
  const clonedObj = { ...obj };

  for (const key in clonedObj) {
    if (Object.prototype.hasOwnProperty.call(clonedObj, key)) {
      const lowerKey = key.toLowerCase();

      if (config.maskFields.includes(lowerKey)) {
        // Obfuscate the value if the key matches our blacklist
        clonedObj[key] = '********';
      } else if (typeof clonedObj[key] === 'object') {
        // Recursively scan nested objects or arrays
        clonedObj[key] = maskObject(clonedObj[key]);
      }
    }
  }

  return clonedObj;
};

/**
 * Winston custom format wrapper.
 * Intercepts the log 'info' object before it is serialized to JSON or text.
 */
// Winston internally refers to the data payload flowing through its pipeline as an info object, regardless of the actual severity level of the log.
const maskFormatter = winston.format((info) => {
  // Winston stores metadata and explicit log objects directly on the 'info' object
  // We process the entire info object to catch sensitive keys wherever they sit
  return maskObject(info);
});

module.exports = maskFormatter;