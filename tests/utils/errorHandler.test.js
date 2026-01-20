import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ExternalAPIError,
  handleError,
  asyncHandler,
} from '../../src/utils/errorHandler.js';

describe('errorHandler', () => {
  describe('AppError', () => {
    it('should create an error with default status code 500', () => {
      const error = new AppError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
      expect(error.details).toBeNull();
    });

    it('should create an error with custom status code', () => {
      const error = new AppError('Test error', 404);
      expect(error.statusCode).toBe(404);
    });

    it('should create an error with details', () => {
      const details = { field: 'value' };
      const error = new AppError('Test error', 500, details);
      expect(error.details).toEqual(details);
    });
  });

  describe('ValidationError', () => {
    it('should create a 400 error', () => {
      const error = new ValidationError('Invalid input');
      expect(error.message).toBe('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('ValidationError');
      expect(error.isOperational).toBe(true);
    });

    it('should include details', () => {
      const details = { field: 'email' };
      const error = new ValidationError('Invalid email', details);
      expect(error.details).toEqual(details);
    });
  });

  describe('NotFoundError', () => {
    it('should create a 404 error', () => {
      const error = new NotFoundError('Resource not found');
      expect(error.message).toBe('Resource not found');
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('NotFoundError');
    });
  });

  describe('UnauthorizedError', () => {
    it('should create a 401 error', () => {
      const error = new UnauthorizedError('Unauthorized');
      expect(error.message).toBe('Unauthorized');
      expect(error.statusCode).toBe(401);
      expect(error.name).toBe('UnauthorizedError');
    });
  });

  describe('ExternalAPIError', () => {
    it('should create a 502 error by default', () => {
      const error = new ExternalAPIError('API failed');
      expect(error.message).toBe('API failed');
      expect(error.statusCode).toBe(502);
      expect(error.name).toBe('ExternalAPIError');
    });

    it('should accept custom status code', () => {
      const error = new ExternalAPIError('API failed', 503);
      expect(error.statusCode).toBe(503);
    });
  });

  describe('handleError', () => {
    let req, res, consoleErrorSpy;

    beforeEach(() => {
      req = {};
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('should handle operational errors with correct status code', () => {
      const error = new ValidationError('Invalid input');
      handleError(error, req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid input',
        details: null,
      });
    });

    it('should handle operational errors with details', () => {
      const details = { field: 'email' };
      const error = new ValidationError('Invalid email', details);
      handleError(error, req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid email',
        details: details,
      });
    });

    it('should handle Axios errors with response', () => {
      const error = {
        response: {
          status: 404,
          data: { message: 'Not found' },
        },
      };
      handleError(error, req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'External API error',
        details: 'Not found',
      });
    });

    it('should handle Axios errors with err field in response data', () => {
      const error = {
        response: {
          status: 400,
          data: { err: 'Bad request error' },
        },
      };
      handleError(error, req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'External API error',
        details: 'Bad request error',
      });
    });

    it('should default to 502 for Axios errors without status', () => {
      const error = {
        response: {
          data: {},
        },
        message: 'Network error',
      };
      handleError(error, req, res);

      expect(res.status).toHaveBeenCalledWith(502);
    });

    it('should handle unknown errors with 500 status', () => {
      const error = new Error('Unknown error');
      handleError(error, req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error',
        details: 'An unexpected error occurred',
      });
    });

    it('should include error message in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Test error');
      handleError(error, req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error',
        details: 'Test error',
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should log error information', () => {
      const error = new ValidationError('Test error');
      handleError(error, req, res);

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('asyncHandler', () => {
    let req, res;

    beforeEach(() => {
      req = {};
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
    });

    it('should execute async function successfully', async () => {
      const fn = jest.fn().mockResolvedValue(undefined);
      const handler = asyncHandler(fn);

      await handler(req, res);

      expect(fn).toHaveBeenCalledWith(req, res);
    });

    it('should catch and handle errors from async function', async () => {
      const error = new ValidationError('Test error');
      const fn = jest.fn().mockRejectedValue(error);
      const handler = asyncHandler(fn);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Test error',
        details: null,
      });

      consoleErrorSpy.mockRestore();
    });

    it('should handle thrown errors in async function', async () => {
      const fn = async () => {
        throw new NotFoundError('Not found');
      };
      const handler = asyncHandler(fn);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);

      consoleErrorSpy.mockRestore();
    });
  });
});
