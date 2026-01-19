/**
 * Validation utilities
 */

/**
 * Validate required fields in request body
 */
export function validateRequired(data, fields) {
  const missing = fields.filter((field) => !data[field]);

  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
}

/**
 * Validate framework value
 */
export function validateFramework(framework) {
  const validFrameworks = ['react', 'vue', 'angular', 'html'];

  if (!validFrameworks.includes(framework)) {
    throw new Error(`Invalid framework. Must be one of: ${validFrameworks.join(', ')}`);
  }
}

/**
 * Validate AI provider
 */
export function validateAIProvider(provider) {
  const validProviders = ['github', 'openai', 'anthropic'];

  if (provider && !validProviders.includes(provider)) {
    throw new Error(`Invalid AI provider. Must be one of: ${validProviders.join(', ')}`);
  }

  return provider || 'github';
}

/**
 * Validate array of frameworks
 */
export function validateFrameworks(frameworks) {
  if (!Array.isArray(frameworks)) {
    throw new Error('Frameworks must be an array');
  }

  frameworks.forEach((framework) => validateFramework(framework));
}

/**
 * Sanitize file name for safe file system usage
 */
export function sanitizeFileName(name) {
  return name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
}

/**
 * Validate and parse positive integer
 */
export function validatePositiveInteger(value, fieldName, defaultValue) {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  const parsed = parseInt(value, 10);

  if (isNaN(parsed) || parsed < 1) {
    throw new Error(`${fieldName} must be a positive integer`);
  }

  return parsed;
}

/**
 * Validate boolean value
 */
export function validateBoolean(value, defaultValue = false) {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  return Boolean(value);
}
