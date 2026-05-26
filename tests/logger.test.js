const winston = require('winston');

// 1. Mock the config file completely
jest.mock('../src/config', () => ({
isDevelopment: false,
logLevel: 'info',
maskFields: ['password', 'token'],
requestIdHeader: 'x-request-id'
}));

const logger = require('../src/logger');

describe('Core Logger Utility', () => {
let loggedPayloads = [];

beforeEach(() => {
    loggedPayloads = []; // Clear array before each test

    // 2. Clear out any production transports
    logger.clear();

    // 3. Create a clean Console transport
    const testTransport = new winston.transports.Console();

    // 4. Intercept the write/log method to capture the output object instantly
    testTransport.log = (info, callback) => {
    // Winston passes the fully formatted info object directly here
    loggedPayloads.push({ ...info });
    if (callback) callback();
    };

    logger.add(testTransport);
});

afterEach(() => {
    jest.clearAllMocks();
});

// Helper to safely grab the tracked log payload
const getLogPayload = () => {
    if (loggedPayloads.length === 0) {
    throw new Error("No logs captured! Check if the log level is filtering it out.");
    }
    return loggedPayloads[0];
};

test('should output logs in structured format with timestamp and level', () => {
    logger.info('Test production log');

    const log = getLogPayload();

    expect(log).toHaveProperty('timestamp');
    expect(log.level).toBe('info');
    expect(log.message).toBe('Test production log');
});

test('should deep-mask sensitive fields automatically', () => {
    const payload = {
    user: {
        username: 'john_doe',
        password: 'super-secret-password',
        nested: {
        token: 'secret-api-token'
        }
    }
    };

    logger.info('User login attempt', payload);

    const log = getLogPayload();

    expect(log.user.username).toBe('john_doe');
    expect(log.user.password).toBe('********');
    expect(log.user.nested.token).toBe('********');
});

test('should automatically capture error stack traces', () => {
    const sampleError = new Error('Database connection timeout');
    
    // Pass the error object so Winston handles it
    logger.error('Database failed', sampleError);

    const log = getLogPayload();

    expect(log.level).toBe('error');
    
    // CHANGE THIS LINE: Use .toContain() instead of .toBe() to account for Winston's combined message string
    expect(log.message).toContain('Database failed');
    
    expect(log).toHaveProperty('stack');
    expect(log.stack).toContain('Error: Database connection timeout');
});
});