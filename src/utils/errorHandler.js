/**
 * Custom error classes and error handler
 */

export class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message, details = null) {
    super(message, 404, details);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message, details = null) {
    super(message, 401, details);
    this.name = 'UnauthorizedError';
  }
}

export class ExternalAPIError extends AppError {
  constructor(message, statusCode = 502, details = null) {
    super(message, statusCode, details);
    this.name = 'ExternalAPIError';
  }
}

/**
 * Global error handler for API routes
 */
export function handleError(error, req, res) {
  console.error('Error:', {
    name: error.name,
    message: error.message,
    statusCode: error.statusCode,
    details: error.details,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  });

  // Handle known operational errors
  if (error.isOperational) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
      details: error.details,
    });
  }

  // Handle Axios errors
  if (error.response) {
    const statusCode = error.response.status || 502;
    return res.status(statusCode).json({
      success: false,
      error: 'External API error',
      details: error.response.data?.err || error.response.data?.message || error.message,
    });
  }

  // Handle unknown errors
  return res.status(500).json({
    success: false,
    error: 'Internal server error',
    details:
      process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
  });
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export function asyncHandler(fn) {
  return async (req, res) => {
    try {
      await fn(req, res);
    } catch (error) {
      handleError(error, req, res);
    }
  };
}
