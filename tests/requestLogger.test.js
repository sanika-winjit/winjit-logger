jest.mock('uuid', () => ({ v4: () => 'mocked-uuid-1111-2222' }));
const requestLogger = require('../src/middleware/requestLogger');
const logger = require('../src/logger');

// Spy on the logger functions so we can verify if the middleware triggers them
jest.spyOn(logger, 'info').mockImplementation(() => {});
jest.spyOn(logger, 'error').mockImplementation(() => {});
jest.spyOn(logger, 'warn').mockImplementation(() => {});

describe('Request Logger Middleware', () => {
let req;
let res;
let next;

beforeEach(() => {
    jest.clearAllMocks();

    // Mock Express Request Object
    req = {
    method: 'GET',
    url: '/api/test',
    ip: '127.0.0.1',
    headers: { 'user-agent': 'Jest-Test' },
    header: jest.fn().mockReturnValue(undefined), // No incoming request-id header by default
    query: {},
    body: {}
    };

    // Mock Express Response Object
    res = {
    statusCode: 200,
    setHeader: jest.fn(),
    on: jest.fn() // Captures event listeners like res.on('finish')
    };

    // Mock Express Next Function
    next = jest.fn();
});

test('should generate a new request ID if one is not present in headers', () => {
    requestLogger(req, res, next);

    expect(req).toHaveProperty('id');
    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', req.id);
    expect(logger.info).toHaveBeenCalledWith(expect.objectContaining({
    type: 'http_request',
    requestId: req.id,
    method: 'GET',
    url: '/api/test'
    }));
    expect(next).toHaveBeenCalled();
});

test('should reuse an existing request ID passed in headers', () => {
    req.header.mockReturnValue('existing-gateway-id-123');

    requestLogger(req, res, next);

    expect(req.id).toBe('existing-gateway-id-123');
    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', 'existing-gateway-id-123');
});

test('should log response and track duration on finish event', () => {
    let finishCallback;
    
    // Intercept the callback passed to res.on('finish', callback)
    res.on.mockImplementation((event, callback) => {
    if (event === 'finish') finishCallback = callback;
    });

    requestLogger(req, res, next);

    // Manually trigger the finish event callback simulated by Express closing a connection
    res.statusCode = 200;
    finishCallback();

    expect(logger.info).toHaveBeenLastCalledWith(expect.objectContaining({
    type: 'http_response',
    statusCode: 200,
    durationMs: expect.any(Number)
    }));
});

test('should log as error if status code is 500 or above', () => {
    let finishCallback;
    res.on.mockImplementation((event, callback) => {
    if (event === 'finish') finishCallback = callback;
    });

    requestLogger(req, res, next);

    res.statusCode = 503;
    finishCallback();

    expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({
    type: 'http_response',
    statusCode: 503
    }));
});
});