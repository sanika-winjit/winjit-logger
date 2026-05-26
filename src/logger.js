const winston = require('winston');
const config = require('./config');
const maskFormatter = require('./formatter/maskFormatter');

// 1. Define custom formats for Development vs Production
const developmentFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.printf(({ level, message, timestamp, stack, ...metadata }) => {
        let output = `[${timestamp}] ${level}: `;
        
        // If an actual Error object with a stack trace is logged, show the stack
        if (stack) {
            output += `${message}\n${stack}`;
        } else if (typeof message === 'object') {
            output += JSON.stringify(message, null, 2);
        } else {
            output += message;
        }

        // Append any extra metadata passed to the log (excluding internal Winston keys)
        if (Object.keys(metadata).length > 0) {
            output += ` \nMetadata: ${JSON.stringify(metadata, null, 2)}`;
        }
        return output;
    })
);
// As prod logs are mostly scraped by tools like Datadog, Splunk, or ElasticSearch (ELK), they are kept simple
const productionFormat = winston.format.combine(
  winston.format.errors({ stack: true }), // Automatically append stack traces to JSON output
  winston.format.json() // Stream efficient, structured JSON strings
);

// 2. Initialize the Winston Logger instance
const logger = winston.createLogger({
    // error < warn < info < http < verbose < debug
    // If we set level as info then only error, warn and info type logs will appear
    level: config.logLevel,
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        maskFormatter(), // Apply our recursive masking tool globally across all log levels
        config.isDevelopment ? developmentFormat : productionFormat
    ),
    transports: [
        // Standardizing on Console output (perfect for Docker containers, AWS ECS, K8s, etc.)
        // Third-party log forwarders (like FluentBit, Logstash, or Datadog Agent) sit on the infrastructure level to scrape those logs and route them to an aggregator. Writing logs to local files inside a container is an anti-pattern.
        new winston.transports.Console()
    ]
});

module.exports = logger;