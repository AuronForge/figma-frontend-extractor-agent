import { describe, test, expect, jest } from '@jest/globals';
import handler from '../../api/v1/swagger.js';

describe('Swagger Endpoint', () => {
  test('should return Swagger spec as JSON on GET request', async () => {
    const mockReq = {
      method: 'GET',
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await handler(mockReq, mockRes);

    expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalled();

    const swaggerData = mockRes.json.mock.calls[0][0];
    expect(swaggerData.openapi).toBe('3.0.0');
    expect(swaggerData.servers).toBeDefined();
    expect(swaggerData.servers.length).toBeGreaterThan(0);
  });

  test('should return 405 Method Not Allowed on non-GET request', async () => {
    const mockReq = {
      method: 'POST',
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(405);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Method not allowed',
    });
  });
});
