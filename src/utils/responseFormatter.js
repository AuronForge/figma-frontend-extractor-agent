/**
 * Response formatting utilities
 */

/**
 * Format success response
 */
export function successResponse(data, statusCode = 200) {
  return {
    statusCode,
    body: {
      success: true,
      ...data,
    },
  };
}

/**
 * Format error response
 */
export function errorResponse(error, details = null, statusCode = 500) {
  return {
    statusCode,
    body: {
      success: false,
      error,
      details,
    },
  };
}

/**
 * Format metadata for responses
 */
export function formatMetadata(additionalData = {}) {
  return {
    timestamp: new Date().toISOString(),
    ...additionalData,
  };
}

/**
 * Send JSON response
 */
export function sendResponse(res, statusCode, data) {
  return res.status(statusCode).json(data);
}

/**
 * Send success response
 */
export function sendSuccess(res, data, statusCode = 200) {
  return sendResponse(res, statusCode, {
    success: true,
    ...data,
  });
}

/**
 * Send error response
 */
export function sendError(res, error, details = null, statusCode = 500) {
  return sendResponse(res, statusCode, {
    success: false,
    error,
    details,
  });
}
