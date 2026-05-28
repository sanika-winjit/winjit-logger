# @winjit/logger

A standardized, structured logging utility and Express middleware for Winjit Node.js projects. Built on top of Winston and UUID, this library ensures log consistency, automatic data masking for compliance, and end-to-end request tracing.

---

## Features

* **Structured JSON Output:** Formats logs automatically as JSON in production for seamless ingestion into log aggregators (ELK, Splunk, Datadog, etc.).
* **Human-Readable Dev Logs:** Displays beautifully colorized and readable logs during development.
* **Automatic Context Tracing:** Express middleware automatically handles incoming `X-Request-ID` headers or generates cryptographically secure UUID v4 trace IDs for untracked requests.
* **Deep Sensitive Data Masking:** Recursively sanitizes payloads to strip out credentials, PII, and tokens (`password`, `token`, etc.) before they hit storage.
* **Error Stack Extraction:** Automatically extracts and structures deep tracebacks from native JavaScript `Error` objects.

---

## Installation

Since this is an internal Winjit utility, you can install it directly from our private Git repository.

Run the following command in your project terminal:

```bash
# Install the stable version for only Express framework support
npm install https://github.com/sanika-winjit/winjit-logger.git#v1.0.0

```

---

## Configuration

You can configure the logger by adding the following keys to your root .env file:

1. NODE_ENV
Type: string
Default: development
Description: Toggles the logging format. Set to development for pretty-printed, colorized logs in your local terminal, or production for structured JSON output suitable for log aggregators.

2. LOG_LEVEL
Type: string
Default: info
Description: Specifies the minimum log severity level to output. Any logs below this severity will be suppressed. Available levels from highest to lowest severity are: error, warn, info, http, and debug.

---

## Quick Start Guide

### 1. Initialize Request Tracking (Express Middleware)

To capture every incoming HTTP request and inject unique trace IDs, plug the middleware into your primary Express boot file (e.g., `app.js` or `server.js`).

By default the key considered as request ID in headers is x-request-id', but it can be updated by adding LOGGER_REQUEST_ID_HEADER in .env file

~~javascript
const express = require('express');
const { requestLogger, logger } = require('@winjit/logger');

const app = express();

// Attach the tracking middleware before your application routes
app.use(requestLogger);

app.get('/api/v1/users', (req, res) => {
  // Access the generated/forwarded request ID anywhere in your route handler
  logger.info('Fetching user profile database records', { requestId: req.id });
  
  res.status(200).json({ success: true, data: [] });
});

app.listen(3000, () => {
  logger.info('Server successfully booted up on port 3000');
});

~~

### 2. Manual System Logging

Import the core logger instance anywhere in your business logic layer to trace execution steps:

~~javascript
const { logger } = require('@winjit/logger');

// Standard informational messaging
logger.info('Third-party payment payload sent successfully');

// Debug level traces (hidden in production by default)
logger.debug('Internal cache lookups evaluated', { itemsCount: 42 });
~~

### 3. Error Tracking with Automatic Stack Tracing

Pass standard JavaScript `Error` objects directly to `.error()`. The utility will isolate the error string from the message and break out the call stack into an inspectable JSON property:

~~javascript
try {
  throw new Error('Database read operation timed out');
} catch (error) {
  logger.error('Failed to process incoming transaction request', error);
}
~~

### 4. Automatic Payload Masking & Custom Fields

The utility deeply sanitizes logged objects instantly. By default, it automatically masks universal sensitive keys: `password`, `token`, `authorization`, `card_number`, and `secret`.

#### Using Default Masking

~~javascript
const payload = {
  user: {
    email: 'something.com',
    password: 'cleartext-password' // Automatically masked -> ********
  }
};
logger.info('User update', payload);
~~

#### Adding custom fields for masking

Add a comma-separated list to your .env file:

LOGGER_CUSTOM_MASK_FIELDS: ssn, medical_id, routing_number

---

## Run the Jest unit tests

npm test
