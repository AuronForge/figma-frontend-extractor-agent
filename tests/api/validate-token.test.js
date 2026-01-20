import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock axios
const mockGet = jest.fn();
await jest.unstable_mockModule('axios', () => ({
  default: {
    get: mockGet,
  },
}));

// Import the handler
const validateTokenModule = await import('../../api/v1/validate-token.js');
const handler = validateTokenModule.default;

describe('validate-token endpoint', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it('should accept GET requests', async () => {
    req.method = 'GET';
    process.env.FIGMA_ACCESS_TOKEN = '';

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Figma token not configured',
      details: 'Please set FIGMA_ACCESS_TOKEN in environment variables',
    });
  });

  it('should accept POST requests', async () => {
    req.method = 'POST';
    process.env.FIGMA_ACCESS_TOKEN = '';

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Figma token not configured',
      details: 'Please set FIGMA_ACCESS_TOKEN in environment variables',
    });
  });

  it('should reject PUT requests', async () => {
    req.method = 'PUT';

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Method not allowed',
    });
  });

  it('should reject DELETE requests', async () => {
    req.method = 'DELETE';

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Method not allowed',
    });
  });

  it('should return 401 when token not configured', async () => {
    req.method = 'GET';
    delete process.env.FIGMA_ACCESS_TOKEN;

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should validate token successfully', async () => {
    req.method = 'GET';
    process.env.FIGMA_ACCESS_TOKEN = 'test-token-123';

    const mockUserData = {
      id: 'user-123',
      email: 'test@example.com',
      handle: 'testuser',
    };

    mockGet.mockResolvedValue({ data: mockUserData });

    await handler(req, res);

    expect(mockGet).toHaveBeenCalledWith('https://api.figma.com/v1/me', {
      headers: {
        'X-Figma-Token': 'test-token-123',
      },
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Figma token is valid',
      user: mockUserData,
    });
  });

  it('should handle invalid token (403 response)', async () => {
    req.method = 'GET';
    process.env.FIGMA_ACCESS_TOKEN = 'invalid-token';

    const error = new Error('Forbidden');
    error.response = { status: 403 };
    mockGet.mockRejectedValue(error);

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Invalid Figma token',
      details: 'The configured FIGMA_ACCESS_TOKEN is invalid or expired',
      help: 'Generate a new token at https://www.figma.com/settings',
    });
  });

  it('should handle API errors', async () => {
    req.method = 'POST';
    process.env.FIGMA_ACCESS_TOKEN = 'test-token-123';

    const error = new Error('Network error');
    mockGet.mockRejectedValue(error);

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Failed to validate token',
      details: 'Network error',
    });
  });
});
