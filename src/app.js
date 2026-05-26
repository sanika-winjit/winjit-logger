/**
 * Main entry point for the logger library.
 * Exposes the core winston logger instance and the Express request tracing middleware.
 */

const logger = require('./logger');
const requestLogger = require('./middleware/requestLogger');

module.exports = {
    logger,
    requestLogger
};