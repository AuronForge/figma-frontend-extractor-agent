import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  successResponse,
  errorResponse,
  formatMetadata,
  sendResponse,
  sendSuccess,
  sendError,
} from '../../src/utils/responseFormatter.js';

describe('responseFormatter', () => {
  describe('successResponse', () => {
    it('should format success response with default status code', () => {
      const data = { message: 'Success' };
      const response = successResponse(data);

      expect(response).toEqual({
        statusCode: 200,
        body: {
          success: true,
          message: 'Success',
        },
      });
    });

    it('should format success response with custom status code', () => {
      const data = { id: 123 };
      const response = successResponse(data, 201);

      expect(response).toEqual({
        statusCode: 201,
        body: {
          success: true,
          id: 123,
        },
      });
    });

    it('should merge multiple data properties', () => {
      const data = { field1: 'value1', field2: 'value2' };
      const response = successResponse(data);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('field1', 'value1');
      expect(response.body).toHaveProperty('field2', 'value2');
    });
  });

  describe('errorResponse', () => {
    it('should format error response with default status code', () => {
      const response = errorResponse('Error message');

      expect(response).toEqual({
        statusCode: 500,
        body: {
          success: false,
          error: 'Error message',
          details: null,
        },
      });
    });

    it('should format error response with custom status code', () => {
      const response = errorResponse('Not found', null, 404);

      expect(response).toEqual({
        statusCode: 404,
        body: {
          success: false,
          error: 'Not found',
          details: null,
        },
      });
    });

    it('should include error details', () => {
      const details = { field: 'email', reason: 'invalid format' };
      const response = errorResponse('Validation failed', details, 400);

      expect(response).toEqual({
        statusCode: 400,
        body: {
          success: false,
          error: 'Validation failed',
          details: details,
        },
      });
    });
  });

  describe('formatMetadata', () => {
    it('should return object with timestamp', () => {
      const metadata = formatMetadata();

      expect(metadata).toHaveProperty('timestamp');
      expect(typeof metadata.timestamp).toBe('string');
      expect(new Date(metadata.timestamp).toISOString()).toBe(metadata.timestamp);
    });

    it('should merge additional data', () => {
      const additionalData = { userId: 123, action: 'create' };
      const metadata = formatMetadata(additionalData);

      expect(metadata).toHaveProperty('timestamp');
      expect(metadata).toHaveProperty('userId', 123);
      expect(metadata).toHaveProperty('action', 'create');
    });

    it('should handle empty additional data', () => {
      const metadata = formatMetadata({});

      expect(Object.keys(metadata)).toEqual(['timestamp']);
    });
  });

  describe('sendResponse', () => {
    let res;

    beforeEach(() => {
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
    });

    it('should send response with correct status code and data', () => {
      const data = { message: 'Test' };
      sendResponse(res, 200, data);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(data);
    });

    it('should chain status and json calls', () => {
      sendResponse(res, 404, { error: 'Not found' });

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('sendSuccess', () => {
    let res;

    beforeEach(() => {
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
    });

    it('should send success response with default status 200', () => {
      const data = { message: 'Success' };
      sendSuccess(res, data);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success',
      });
    });

    it('should send success response with custom status code', () => {
      const data = { id: 123 };
      sendSuccess(res, data, 201);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        id: 123,
      });
    });

    it('should include success flag in response', () => {
      sendSuccess(res, { field: 'value' });

      const callArgs = res.json.mock.calls[0][0];
      expect(callArgs.success).toBe(true);
      expect(callArgs.field).toBe('value');
    });
  });

  describe('sendError', () => {
    let res;

    beforeEach(() => {
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
    });

    it('should send error response with default status 500', () => {
      sendError(res, 'Error message');

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error message',
        details: null,
      });
    });

    it('should send error response with custom status code', () => {
      sendError(res, 'Bad request', null, 400);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should include error details', () => {
      const details = { field: 'email' };
      sendError(res, 'Validation failed', details, 400);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        details: details,
      });
    });

    it('should set success flag to false', () => {
      sendError(res, 'Error');

      const callArgs = res.json.mock.calls[0][0];
      expect(callArgs.success).toBe(false);
    });
  });
});
