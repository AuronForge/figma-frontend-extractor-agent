import { describe, test, expect, jest } from '@jest/globals';
import handler from '../../api/v1/api-docs.js';

describe('API Docs Endpoint', () => {
  test('should return HTML with Swagger UI on GET request', async () => {
    const mockReq = {
      method: 'GET',
      headers: {
        host: 'localhost:3003',
      },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await handler(mockReq, mockRes);

    expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/html');
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.send).toHaveBeenCalled();

    const htmlContent = mockRes.send.mock.calls[0][0];
    expect(htmlContent).toContain('swagger-ui');
    expect(htmlContent).toContain('Figma Frontend Extractor API');
    expect(htmlContent).toContain('http://localhost:3003/api/v1/swagger');
  });

  test('should use x-forwarded-proto header for production HTTPS', async () => {
    const mockReq = {
      method: 'GET',
      headers: {
        host: 'figma-frontend-extractor-agent.vercel.app',
        'x-forwarded-proto': 'https',
      },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await handler(mockReq, mockRes);

    const htmlContent = mockRes.send.mock.calls[0][0];
    expect(htmlContent).toContain(
      'https://figma-frontend-extractor-agent.vercel.app/api/v1/swagger'
    );
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
