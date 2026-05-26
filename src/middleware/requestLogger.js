const { v4: uuidv4 } = require('uuid');
const logger = require('../logger');
const config = require('../config');

/**
 * Express middleware to log incoming HTTP requests and outgoing responses.
 * Injects a unique request ID for distributed tracing.
 */
const requestLogger = (req, res, next) => {
    // 1. Extract existing Request ID (if passed by an API Gateway) or generate a new one
    const requestId = req.header(config.requestIdHeader) || uuidv4();

    // Attach the request ID to both the request object (for downstream use) and response headers
    req.id = requestId;
    res.setHeader(config.requestIdHeader, requestId);

    // Record high-resolution real time to calculate exact request duration
    const startTime = process.hrtime();

    // 2. Log the incoming request details
    logger.info({
        message: `HTTP Request: ${req.method} ${req.url}`,
        type: 'http_request',
        requestId,
        method: req.method,
        url: req.url,
        ip: req.ip,
        headers: req.headers, // Sensitive headers like 'authorization' will be masked by our utility
        query: req.query,
        body: req.body        // Payloads like passwords will be caught and masked here too
    });

    // 3. Intercept the 'finish' event to log the response metric
    res.on('finish', () => {
        // Calculate the time difference
        const diff = process.hrtime(startTime);
        const durationMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2); // Convert to milliseconds string

        const logData = {
            message: `HTTP Response: ${req.method} ${req.url} - Status ${res.statusCode} (${durationMs}ms)`,
            type: 'http_response',
            requestId,
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            durationMs: parseFloat(durationMs)
        };

        // Dynamically adjust the log severity level based on the HTTP status code
        if (res.statusCode >= 500) {
            logger.error(logData); // Server crashes / critical failures
        } else if (res.statusCode >= 400) {
            logger.warn(logData);  // Bad requests, unauthorized access, validation errors
        } else {
            logger.info(logData);  // Successful cycles (2xx, 3xx)
        }
    });

    next();
};

module.exports = requestLogger;